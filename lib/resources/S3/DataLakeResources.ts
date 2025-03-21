import { Stack, Duration, RemovalPolicy, StackProps, CfnOutput, Aws, aws_iam as iam, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';

config();

export class S3DataLakeResources extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const bucketName = process.env.BUCKETNAME_S3_LAKE || 'datalake-bucket';

    const bucket = new s3.Bucket(this, 'DataLakeBucket', {
      versioned: false,
      bucketName: bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Adiciona as pastas Row e Refined
    bucket.addLifecycleRule({
      prefix: 'Refined/',
      enabled: true,
      expiration: Duration.days(60), // Expiração em 365 dias
    });

    // Permissões para upload de arquivos
    const bucketPolicy = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/*`],
      principals: [new iam.AccountPrincipal(Aws.ACCOUNT_ID)],
    });

    bucket.addToResourcePolicy(bucketPolicy);

    new CfnOutput(this, 'BucketNameOutput', {
      value: bucket.bucketName,
      description: 'The name of the S3 bucket',
    });
  }
}