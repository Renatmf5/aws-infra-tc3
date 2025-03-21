import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerResources } from '../resources/Server/ServerResources';
import { envValidator } from '../resources/Server/envValidator';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { CICDIngestDataStack } from '../resources/Pipelines/CodePipelineIngestDataApp';


export interface EC2Props extends StackProps {
  logLevel: string;
  sshPubKey: string;
  cpuType: string;
  instanceSize: string;
  vpc: Vpc;
  sshSecurityGroup: SecurityGroup;
}

export class IngestDataAppStack extends Stack {
  constructor(scope: Construct, id: string, props: EC2Props) {
    super(scope, id, props);

    const { logLevel, sshPubKey, cpuType, instanceSize, vpc, sshSecurityGroup } = props;

    // Validação das variáveis de ambiente
    envValidator(props);

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

    // Parâmetro de saída: Comandos SSM e SSH
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instance.instanceId}`,
    });

    new CfnOutput(this, 'sshCommand', {
      value: `ssh ec2-user@${serverResources.instance.instancePublicDnsName}`,
    });


    // Criação do pipeline de CI/CD
    const cicdIngestDataStack = new CICDIngestDataStack(this, 'CICDIngestDataStack', {
      env: props.env,
    });

    cicdIngestDataStack.addDependency(this);

  }
} 