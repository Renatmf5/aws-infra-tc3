# Infraestrutura de Deploy na AWS com CDK

Este repositório contém a definição e o deploy de infraestrutura do projeto Tech Challenge 3 utilizando o AWS Cloud Development Kit (CDK). O projeto configura recursos da AWS como EC2, Load Balancer, VPC, Route53 e outros, de maneira escalável e automatizada.

## Descrição

Este projeto utiliza o AWS CDK para provisionar e gerenciar recursos de infraestrutura na Amazon Web Services (AWS). Ele foi projetado para automatizar a criação de ambientes de produção e desenvolvimento com segurança e eficiência.

A infraestrutura inclui:
- **VPC**: Rede privada para isolar a infraestrutura.
- **S3**: Armazenamento de objetos construído para armazenar e recuperar qualquer volume de dados de qualquer local
- **EC2**: Instâncias de máquinas virtuais para rodar aplicações.
- **Application Load Balancer (ALB)**: Balanceamento de carga para distribuir o tráfego.
- **Route53**: Configuração de DNS para gerenciamento de domínios.
- **Certificate Manager**: Provisione e gerencie certificados SSL/TLS com serviços da AWS e recursos conectados.
- **Code Pipeline**: Automatização de pipelines de entrega contínua para oferecer atualizações rápidas e confiáveis
- **CodeDeploy**: Automatização de implantações de código para manter a disponibilidade das aplicações
- **Parameter Store**: Oferece armazenamento hierárquico seguro para gerenciamento de dados de configuração e gerenciamento de segredos.
- **RDS**: Banco de dados relacional gerenciado para armazenar e consultar dados de forma escalável e segura.

## Arquitetura

A arquitetura proposta é composta pelos seguintes componentes:

### VPC

- **Descrição**: 
  - **VPCResources.ts**: Código responsável pela configuração da VPC do projeto.
- **Configuração**:
  - **Sub-redes públicas e privadas**: São criadas 2 subnets configuradas para permitir acesso direto à internet, as instâncias EC2 serão distribuídas nessas sub-redes.
    - Define as sub-rede como pública e Atribui Ip publico às instâncias lançadas na sub-rede
    - Bloco de CIDR com tamanho de 24
  - **Gateways NAT**: Não são criados gateways NAT.
  - **Zonas de Disponibilidade**: Usa até duas zonas de disponibilidade (AZs).
- **Segurança**:
  - **Grupos de Segurança**: Criação de grupos de segurança para controlar o tráfego de entrada e saída.
  - **Regras de Entrada**: Permite tráfego SSH (porta 22) de qualquer endereço IPv4.
  - **Regra de Saída**: Permite todo tráfego de saída.


### S3

- **Descrição**:
  - **S3BucketResources.ts** Código responsável pela configuração do Bucket S3 que representa o Data Lake da aplicação.
- **Configuração**:
  - **Armazenamento de Ativos**: Utilizado para armazenar arquivos tratados e lidos pela FastApi do projeto.
  - **Regras de Ciclo de Vida**: Adiciona uma regra de ciclo de vida ao bucket para expirar objetos após 365 dias. pois lemos arquivos com dados anuais.
  - **Backups e Logs**: Sem configuração.
  - **Politicas de Acesso**: Define políticas de acesso que permitem colocar objetos no caminho Lake/ , prefixo que representa o Data Lake da aplicação
- **Ambiente .env**: Variáveis de ambiente utilizada no código necessárias para deploy da stack
  - **BUCKETNAME_S3**: Variável de ambiente que define o nome da bucket utilizada com Data Lake

### RDS

- **Descrição**: Banco de dados relacional gerenciado utilizando Amazon RDS com PostgreSQL para armazenar dados de metricas de backtests e trading em tempo real.
  - **RDSResources.ts**: Código responsável pela configuração do banco de dados RDS PostgreSQL.
- **Configuração**:
  - **Engine**: PostgreSQL versão 16.3.
  - **Tipo de Instância**: `t4g.micro` (Graviton, burstable).
  - **Armazenamento**: 20 GB alocado, com limite máximo de 20 GB.
  - **Rede**: Utiliza a VPC criada no recurso `VPCResources.ts` e sub-redes públicas.
  - **Acessibilidade Pública**: Configurado como publicamente acessível.
  - **Backup**: Retenção de backups automáticos por 7 dias.
  - **Política de Remoção**: Configurado para destruir o banco de dados ao remover a stack.
- **Segurança**:
  - **Secrets Manager**: Gerenciamento de credenciais do banco de dados com geração automática de senha.
  - **Security Group**: 
    - Permite tráfego de entrada na porta 5432 (PostgreSQL) de qualquer endereço IPv4.
    - Permite tráfego interno entre instâncias no mesmo grupo de segurança.
  - **Regras de Saída**: Permite todo o tráfego de saída.
- **Ambiente .env**: Variáveis de ambiente utilizadas para configuração do banco de dados.
  - **RDS_SECRET_NAME**: Nome do segredo no Secrets Manager para credenciais do banco.
  - **RDS_DB_NAME**: Nome do banco de dados (ex.: `TradingSystem`).
  - **RDS_INSTANCE_TYPE**: Tipo de instância configurável (ex.: `t4g.micro`).

### EC2 Instances

- **Descrição**: EC2 Para hospedagem das aplicações do Projeto.
  - **ServerResources.ts**: Uma classe flexível, utilizada para criar os servidores de aplicação da FastApi e da interface Web em Next.js
- **Configuração**: Configurações disponíveis em envValidator.ts
  - **Rede**: Utiliza da VPC criada no recurso VPCResources.ts para inserir seus servidores criados. 
  - **Tipos de Instância**: Configuradas com diferentes tipos de CPU e tamanhos de instância com base nas variáveis de ambiente do projeto, tornando flexível o tamanho da aplicação
  - **Segurança**:
    - **Security group**: Criação de grupo de segurança ec2InstanceSecurityGroup com abertura de trafego de entrada na porta 22 para (ssh) pois se trata de um ambiente educacional e porta 80 (http) para
                          que as instancias possam receber trafego da do cliente via navegador porta 80.
    - **IAM**: Criação de perfil de role IAM para a instância EC2 com permissões específicas para acessar outros serviços da AWS. Inclui políticas gerenciadas e políticas inline.
  - **Tag**: Adiciona tags à instância EC2 para identificar o tipo de servidor (FastAPI ou Next.js).
- **Ambiente .env**: Variáveis de ambiente utilizada no código necessárias para deploy da stack
  - **CDK_DEFAULT_ACCOUNT**: Conta AWS padrão.
  - **CDK_DEFAULT_REGION**: Região AWS padrão.
  - **LOG_LEVEL**: Nível de log (por exemplo, INFO).
  - **SSH_PUB_KEY**: Chave pública SSH para acesso à instância EC2.
  - **CPU_TYPE**: Tipo de CPU (por exemplo, X86_64 ou ARM64).
  - **INSTANCE_SIZE**: Tamanho da instância (por exemplo, MICRO ou LARGE).


### ALB (Application Load Balancer)

- **Descrição**: Configuração do Application Load Balancer (ALB) para a aplicação FastAPI e Next.Js (Web).
  - **FastApiALBResources.ts:**:  Uma classe utilizada para criar e configurar o ALB que balanceia a carga entre as instâncias EC2 da aplicação FastAPI.
  - **NextjsALBResources.ts**: Uma classe utilizada para criar e configurar o ALB que balanceia a carga entre as instâncias EC2 da aplicação Next.Js.
- **Configuração**: 
  - **Rede**: Utiliza da VPC criada no recurso VPCResources.ts para inserir o ALB e os grupos de destino. 
  - **Segurança**:
    - **Security group**: Criação de um grupo de segurança fastapi-ALBSecurityGroup e nextjs-ALBSecurityGroup com regras de entrada para permitir tráfego HTTP (porta 80) e HTTPS (porta 443)
  - **Certificados**: Utiliza certificados SSL/TLS gerenciados pelo AWS Certificate Manager (ACM) para garantir a segurança das comunicações.
  - **Listener**: 
    - **HTTPS Listener**: Configura um listener na porta 443 para tráfego HTTPS, utilizando o certificado fornecido.
    - **HTTP Listener**: Configura um listener na porta 80 para redirecionar o tráfego HTTP.
    - **HTTP Redirect**: Configura um Redirecionamento na porta 80 para o para redirecionar o tráfego HTTP para HTTPS.
  - **Target Group**: Criação de um grupo de destino FastApiTargetGroup que direciona o tráfego para as instâncias EC2 da aplicação FastAPI.
    - **FastApiALBResources.ts:**:  Criação de um grupo de destino FastApiTargetGroup que direciona o tráfego para as instâncias EC2 da aplicação FastAPI.
    - **NextjsALBResources.ts**: Criação de um grupo de destino NextjsALBTargetGrou que direciona o tráfego para as instâncias EC2 da aplicação Next.Js.


## ROUTE-53

- **Descrição**: Configuração de DNS para aplicações do Projeto utilizando Route 53
  - **Route53Stack.ts**: Classe utilizada para criar registros DNS que apontam para os Application Load Balancers (ALBs) das aplicações FastAPI e Next.Js
- **Configuração**: Configurações disponíveis no arquivo .env.
  - **Rede**: Utiliza a zona hospedada (Hosted Zone) configurada no Route 53 para criar registros DNS.
  - **Registros DNS**:
    - **Registro A para FastAPI**: Cria um subdomínio api que aponta para o ALB da aplicação FastAPI.
    - **Registro A para Next.Js**: Cria um subdomínio app que aponta para o ALB da aplicação Next.JS.
- **Ambiente .env**: Carrega variáveis de ambiente do arquivo .env para configurar o domínio
  - **DOMINIO**: Nome do domínio para a zona hospedada no Route 53.
  - **CDK_DEFAULT_ACCOUNT**: Conta AWS padrão.
  - **CDK_DEFAULT_REGION**: Região AWS padrão.

## ACM (Certificate Manager)

- **Descrição**: Utiliza a zona hospedada (Hosted Zone) configurada no Route 53 para validar os certificados via DNS.
  - **AcmResources.ts**: Classe responsável por criar certificados SSL/TLS usando o AWS Certificate Manager (ACM) para duas aplicações: uma API (FastAPI) e um WebApp (Next.js).
- **Validação**: Ambos os certificados são validados via DNS usando a zona hospedada obtida.
- **Ambiente .env**: Carrega variáveis de ambiente do arquivo .env para configurar os certificados
    - **DOMINIO**: Nome do domínio do projeto
    - **SUBDOMINIO**: Sub dominio para aplicação da (FastAPI)
    - **WEBAPP_SUBDOMINIO**: Sub dominio para aplicação web em (Next.js)

## Pipeline CI/CD (CodePipeline+CodeDeploy)

- **Descrição**: Pipeline CI/CD para as aplicações do projeto
  - **CodePipelineFastApiResources.ts:**: Classe responsável por configurar um pipeline CI/CD utilizando AWS CodePipeline e AWS CodeDeploy para a aplicação FastAPI.
  - **CodePipelineNextJsResources.ts:**: Classe responsável por configurar um pipeline CI/CD utilizando AWS CodePipeline e AWS CodeDeploy para a aplicação Next.js.
- **Configuração**:
  - **Pipeline**: 
    - **Artefatos**: Define o artefato de origem do pipeline.
    - **Ação de Origem**: Configura uma ação de origem do GitHub para monitorar o repositório da aplicação FastAPI e Next.Js.
    - **Aplicação e Grupo de Deployment**: Cria uma aplicação no CodeDeploy e um grupo de deployment que referencia as tags da instância EC2 para cada aplicação.
    - **Estágio de Deploy:**: Define o estágio de deploy no pipeline utilizando o CodeDeploy.
- **Ambiente .env**: Variáveis de ambiente utilizadas no código necessárias para deploy da stack:
  - **GITHUB_USERNAME**: Nome de usuário do GitHub.
  - **REPOSITORY_FAST_API**: Nome do repositório da aplicação FastAPI.
  - **REPOSITORY_NEXT_WEBAPP**: Nome do repositório da aplicação NextJs.
  - **github-token**: Token de acesso ao GitHub armazenado no AWS Secrets Manager.

## Parameter Store

- **Descrição**: Armazenamento de Parâmetros para as aplicações do projeto.
  - **ParameterStoreStack.ts**: Classe responsável por criar parâmetros no AWS Systems Manager Parameter Store para o projeto.
- **Configuração**:
  - **Parametros**:
    - **DatabaseUrl**: Cria um parâmetro para a URL do banco de dados da FastAPi SQLLite.
    - **JwtSecret**: Cria um parâmetro para o segredo JWT. (Usado na FastApi).
    - **BucketName**: Cria um parâmetro para o nome do bucket S3. Usado nas demais aplicações via SDK.
    - **Env**: Ambiente da aplicação.


## Estrutura do Projeto

- **bin/**: Encontra-se o código principal de provisionamento de infra. dividido nos

- **lib/**: Descrição do conteúdo e propósito deste diretório.
- **src/resources/server/**: Descrição do conteúdo e propósito deste diretório.
- **test/**: Descrição do conteúdo e propósito deste diretório.
- **Arquivos de configuração**: Breve explicação sobre arquivos como `.gitignore`, `cdk.json`, `package.json`, etc.

## Pré-requisitos

- **Node.js** versão 14.x ou superior
- **AWS CLI** configurado com as credenciais apropriadas
- **AWS CDK** instalado globalmente: 
- **AWS Secrets Manager** Pré configurado Token de acesso ao GitHub armazenado no AWS Secrets Manager, necessário para execução dos pipelines. 
  ```bash
  npm install -g aws-cdk

## Instalação

1. Clone o repositório:
```bash
-  git clone https://github.com/Renatmf5/aws-cdk-ml-infra-pipelines.git
-  cd aws-cdk-ml-infra-pipelines
```
2. Instale as dependências:
```bash
- npm install
```