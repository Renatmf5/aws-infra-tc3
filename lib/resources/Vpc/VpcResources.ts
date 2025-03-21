import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SecurityGroup, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class VPCResourcesStack extends Stack {
  public readonly vpc: Vpc;
  public readonly sshSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {

    super(scope, id, props);

    // Criação de uma VPC com sub-redes públicas
    this.vpc = new Vpc(this, 'VPC_1', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ServerPublic',
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
      ],
    });

    // Criação de um grupo de segurança para SSH
    this.sshSecurityGroup = new SecurityGroup(this, 'SSHSecurityGroup', {
      vpc: this.vpc,
      description: 'Security Group for SSH',
      allowAllOutbound: true,
    });

    // Cria permissão para tráfego de entrada SSH na porta 22 TCP
    this.sshSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
  }
}