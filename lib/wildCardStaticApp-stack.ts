import cdk = require('@aws-cdk/core');
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

const websiteDistSourcePath = './app';

export class wildCardStaticApp extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
      This will pick up deploytime command line context parameters 
      eg:  cdk deploy -c primaryDomain=exampledomain.com.  If we fail to pass in the value from the 
      command line use exampledomain.com. 
    */
    const primaryDomain = this.node.tryGetContext('primaryDomain') ? this.node.tryGetContext('primaryDomain') : "exampledomain.com";

    /*
      Use the name of a Route53 hosted zone that exists in your account, replace 
      exampledomain with your Hostedzone
    */
    const subDomain = `*.${primaryDomain}`

    // Create a private S3 bucket
    const sourceBucket = new Bucket(this, 'cdk-mypoc-website-s3', {
      websiteIndexDocument: 'index.html',
      bucketName: `wildcard-${primaryDomain}`
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OIA', {
      comment: "Setup access from CloudFront to the bucket ( read )"
    });
    sourceBucket.grantRead(originAccessIdentity);

    // Deploy the source code from the /app folder, in this example thats just 1 file.
    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset(websiteDistSourcePath)],
      destinationBucket: sourceBucket
    });

    // We are using a Zone that already exists so we can use a lookup on the Zone name.
    const zone = route53.HostedZone.fromLookup(this, 'baseZone', {
      domainName: primaryDomain
    });

    // Request the wildcard TLS certificate, CDK will take care of domain ownership validation via 
    // CNAME DNS entries in Route53, a custom resource will be used on our behalf
    const myCertificate = new acm.DnsValidatedCertificate(this, 'mySiteCert', {
      domainName: subDomain,
      hostedZone: zone,
    });

    // Create the CloudFront Distribution, set the alternate CNAMEs and pass in the ACM ARN of the cert created.
    const cfDist = new cloudfront.CloudFrontWebDistribution(this, 'myDist', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: sourceBucket,
            originAccessIdentity: originAccessIdentity
          },
          behaviors: [
            { isDefaultBehavior: true }
          ]
        }
      ],
      aliasConfiguration: {
        acmCertRef: myCertificate.certificateArn,
        names: [subDomain],
      }
    });
  
    // Create the wildcard DNS entry in route53 as an alias to the new CloudFront Distribution.
    new route53.ARecord(this, 'AliasRecord', {
      zone,
      recordName: subDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cfDist)),
    });
  }
}