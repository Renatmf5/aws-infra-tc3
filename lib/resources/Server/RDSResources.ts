import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput, } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceType, InstanceClass, InstanceSize, SubnetType, Vpc, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion, Credentials } from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';


interface RDSResourcesProps extends StackProps {
  vpc: Vpc;
  securityGroup: SecurityGroup;
}

export class RDSResourcesStack extends Stack {
  constructor(scope: Construct, id: string, props: RDSResourcesProps) {
    super(scope, id, props);

    const { vpc, securityGroup } = props;

    // Criação do segredo no Secrets Manager
    const rdsSecret = new secretsmanager.Secret(this, 'RDSSecret', {
      secretName: 'RDSPostgresCredentials',
      description: 'Credenciais para o banco de dados RDS PostgreSQL',
      generateSecretString: {
        excludeCharacters: "\"@/\\ '",
        generateStringKey: 'password',
        passwordLength: 30,
        secretStringTemplate: JSON.stringify({ username: 'dbuser' }),
      },
    });

    // Definição de portas
    const allAll = Port.allTraffic();
    const tcp5432 = Port.tcp(5432);

    // Criação do Security Group
    const dbsg = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
      description: id + 'Database',
      securityGroupName: id + 'Database',
    });

    // Regras de Ingress e Egress
    dbsg.addIngressRule(dbsg, allAll, 'all from self');
    dbsg.addEgressRule(Peer.ipv4('0.0.0.0/0'), allAll, 'all out');

    // Regras de Conexão Específicas para PostgreSQL
    const postgresConnectionPorts = [
      { port: tcp5432, description: 'tcp5432 PostgreSQL' },
    ];

    // Adiciona regras de ingresso para fontes específicas
    const ingressSources = [Peer.anyIpv4()]; // Exemplo: permitir de qualquer IP
    for (let ingressSource of ingressSources) {
      for (let c of postgresConnectionPorts) {
        dbsg.addIngressRule(ingressSource, c.port, c.description);
      }
    }


    // Criação do banco de dados RDS PostgreSQL
    const rdsInstance = new DatabaseInstance(this, 'RDSPostgresInstance', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_3,
      }),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      securityGroups: [dbsg],
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      credentials: Credentials.fromSecret(rdsSecret),
      databaseName: 'TradingSystem',
      publiclyAccessible: true,
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new CfnOutput(this, 'RDSInstanceEndpoint', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'Endpoint do banco de dados RDS PostgreSQL',
    });
  }
}