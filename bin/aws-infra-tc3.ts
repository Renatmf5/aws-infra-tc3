#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3DataLakeResources } from '../lib/resources/S3/DataLakeResources';
import { S3DataModelsResources } from '../lib/resources/S3/DataModelsResources';
import { VPCResourcesStack } from '../lib/resources/Vpc/VpcResources';
import { IngestDataAppStack } from '../lib/stacks/IngestDataAppStack';
import { ParameterStoreStack } from '../lib/resources/Utils/ParameterStoreResources';
import { RDSResourcesStack } from '../lib/resources/Server/RDSResources';
import { FastApiAppStack } from '../lib/stacks/FastApiAppStack';
import { CICDFastApiStack } from '../lib/resources/Pipelines/CodePipelineFastApiApp';
import { CICDTradingAppStack } from '../lib/resources/Pipelines/CodePipelineTradingApp';

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};
const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  sshPubKey: process.env.SSH_PUB_KEY || ' ',
  cpuType: process.env.CPU_TYPE || 'X86_64',
  instanceSize: process.env.INSTANCE_SIZE || 'MICRO',
};

const app = new cdk.App();

// Create Parameter Store Stack
const parameterStoreStack = new ParameterStoreStack(app, 'ParameterStoreStack', { env: devEnv });

// S3 Bucket Stack
const s3DataLakeStack = new S3DataLakeResources(app, 'S3DataLakeStack', { env: devEnv });

// S3 Data Models Stack
const s3DataModelsStack = new S3DataModelsResources(app, 'S3DataModelsStack', { env: devEnv });

// Instanciar a stack da VPC
const vpcResourcesStack = new VPCResourcesStack(app, 'VPCResourcesStack', { env: devEnv });

// RDS Resources Stack
const rdsResourcesStack = new RDSResourcesStack(app, 'RDSResourcesStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  securityGroup: vpcResourcesStack.sshSecurityGroup
});

// Ingest Data Stack
const ingestDataAppStack = new IngestDataAppStack(app, 'IngestDataAppStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  sshSecurityGroup: vpcResourcesStack.sshSecurityGroup
});

// FastAPI App Stack
const fastApiAppStack = new FastApiAppStack(app, 'FastApiAppStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  sshSecurityGroup: vpcResourcesStack.sshSecurityGroup
});

// CICD FastAPi Stack
const cicdFastApiStack = new CICDFastApiStack(app, 'CICDFastApiStack', {
  env: devEnv,
});

// CICD Trading Stack
const cicdTradingStack = new CICDTradingAppStack(app, 'CICDTradingStack', {
  env: devEnv,
});

rdsResourcesStack.addDependency(vpcResourcesStack);
fastApiAppStack.addDependency(vpcResourcesStack);
cicdFastApiStack.addDependency(fastApiAppStack);
cicdTradingStack.addDependency(cicdFastApiStack);

app.synth();