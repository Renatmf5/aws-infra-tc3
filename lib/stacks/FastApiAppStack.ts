import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerResources } from '../resources/Server/ServerResources';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { envValidator } from '../resources/Server/envValidator';
import { ACMResources } from '../resources/Utils/AcmResources';
import { FastApiALBResources } from '../resources/Utils/FastApiALBResources';

export interface EC2Props extends StackProps {
  logLevel: string;
  sshPubKey: string;
  cpuType: string;
  instanceSize: string;
  vpc: Vpc;
  sshSecurityGroup: SecurityGroup;
}

export class FastApiAppStack extends Stack {
  public readonly albApi: FastApiALBResources;
  public readonly acm: ACMResources;

  constructor(scope: Construct, id: string, props: EC2Props) {
    super(scope, id, props);

    const { logLevel, sshPubKey, cpuType, instanceSize, vpc, sshSecurityGroup } = props;

    // Validação das variáveis de ambiente
    envValidator(props);

    // Criação do certificado ACM para o ALB
    this.acm = new ACMResources(this, 'ACM');

    // Criação do servidor EC2
    const serverResources = new ServerResources(this, 'EC2-Api-App', {
      vpc: vpc,
      sshSecurityGroup: sshSecurityGroup,
      logLevel,
      sshPubKey,
      cpuType,
      instanceSize: instanceSize.toLowerCase(),
      language: 'python',
    });

    // Criação do ALB para o FastAPI
    this.albApi = new FastApiALBResources(this, 'ALBResources', {
      vpc: vpc,
      instance: serverResources.instance,
      certificate: this.acm.apiCertificate,
    });

    // Parâmetro de saída: Comandos SSM e SSH
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instance.instanceId}`,
    });

    new CfnOutput(this, 'sshCommand', {
      value: `ssh ec2-user@${serverResources.instance.instancePublicDnsName}`,
    });

  }
}
