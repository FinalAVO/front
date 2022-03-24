const fs = require('fs');
const AWS = require('aws-sdk');
const BUCKET_NAME = 's3-001bucket';
const s3 = new AWS.S3({accessKeyId: 'AKIA6RKMBHZQTUOSXPN5',
secretAccessKey:'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'});

const downloadFile = (fileName) => {
  const params = {
    Bucket: 's3-001bucket',
    Key: 'app_review_android.csv',
  };
    s3.getObject(params, function(err, data) {
      if (err) { throw err;}
      fs.writeFileSync(fileName, data.Body);

    });
};
downloadFile('app_review_android.csv');
