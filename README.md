# Building multi-subdomain applications with AWS CDK and CloudFront

This template will deploy a sample html application that listens to incoming requests from any subdomain on the domain specified when the stack is created.

Detailed instructions here:  https://aws.amazon.com/blogs/infrastructure-and-automation/deploy-spa-with-personalized-subdomains-using-aws-cdk/

Infrastructure created:
 - S3 bucket
 - Domain TLS certificate
 - Route 53 DNS entry
 - CloudFront distribution

## Prerequisites
- AWS profile configured
- AWS CDK installed [see here for instructions](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- A domain ( Zone ) that has been deligated to Route 53

## How to deploy this Template

Run 

```
cdk bootstrap
cdk deploy -c domainName={your-domain.name}  
```

##  Cleanup

You will need to manually delete the index.html in the S3 bucket then remove the stack with:

Run

```
cdk destroy
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
