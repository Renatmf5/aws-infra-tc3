#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3DataLakeResources } from '../lib/resources/S3/DataLakeResources';
import { S3DataModelsResources } from '../lib/resources/S3/DataModelsResources';
import { VPCResourcesStack } from '../lib/resources/Vpc/VpcResources';
import { TradingAppStack } from '../lib/stacks/TradingAppStack';
import { ParameterStoreStack } from '../lib/resources/Utils/ParameterStoreResources';
import { RDSResourcesStack } from '../lib/resources/Server/RDSResources';
import { FastApiAppStack } from '../lib/stacks/FastApiAppStack';
import { CICDFastApiStack } from '../lib/resources/Pipelines/CodePipelineFastApiApp';

import { Route53Stack } from '../lib/stacks/Route53AppStack';
import { NextJsAppStack } from '../lib/stacks/NextjsAppStack';
import { CICDNextJsStack } from '../lib/resources/Pipelines/CodePipelineNextjsApp';
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

/*
// Ingest Data Stack
const ingestDataAppStack = new IngestDataAppStack(app, 'IngestDataAppStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  sshSecurityGroup: vpcResourcesStack.sshSecurityGroup
});
*/
// FastAPI App Stack
const fastApiAppStack = new FastApiAppStack(app, 'FastApiAppStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  sshSecurityGroup: vpcResourcesStack.sshSecurityGroup
});

// NextJs App Stack
const nextJsAppStack = new NextJsAppStack(app, 'NextJsAppStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  sshSecurityGroup: vpcResourcesStack.sshSecurityGroup,
  acm: fastApiAppStack.acm
});

// Trading App Stack
const tradingAppStack = new TradingAppStack(app, 'TradingAppStack', {
  ...stackProps,
  env: devEnv,
  vpc: vpcResourcesStack.vpc,
  sshSecurityGroup: vpcResourcesStack.sshSecurityGroup
});

// CICD FastAPi Stack
const cicdFastApiStack = new CICDFastApiStack(app, 'CICDFastApiStack', {
  env: devEnv,
});

// CICD NextJs Stack
const cicdNextJsStack = new CICDNextJsStack(app, 'CICDNextJsStack', {
  env: devEnv,
});

// CICD Trading Stack
const cicdTradingStack = new CICDTradingAppStack(app, 'CICDTradingAppStack', {
  env: devEnv,
});


const route53Stack = new Route53Stack(app, 'Route53Stack', {
  env: devEnv,
  fastApiLoadBalancer: fastApiAppStack.albApi.alb,
  NextJsLoadBalancer: nextJsAppStack.albWeb.alb,
});

rdsResourcesStack.addDependency(vpcResourcesStack);
fastApiAppStack.addDependency(vpcResourcesStack);
nextJsAppStack.addDependency(fastApiAppStack);
cicdFastApiStack.addDependency(fastApiAppStack);
cicdNextJsStack.addDependency(nextJsAppStack);
cicdTradingStack.addDependency(tradingAppStack);
route53Stack.addDependency(fastApiAppStack);


app.synth();