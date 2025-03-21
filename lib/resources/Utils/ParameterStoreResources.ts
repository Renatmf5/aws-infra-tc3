import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

export class ParameterStoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Criar os parâmetros
    new ssm.StringParameter(this, "BinanceKey", {
      parameterName: "/IngestData-app/BINANCE_API_KEY",
      stringValue: process.env.BINANCE_API_KEY || "default_BINANCE_API_KEY"
    });
    new ssm.StringParameter(this, "BinanceSecretKey", {
      parameterName: "/IngestData-ap/BINANCE_SECRET_KEY",
      stringValue: process.env.BINANCE_SECRET_KEY || "default_BINANCE_SECRET_KEY"
    });
  }
}
