const fs = require('fs');
const AWS = require('aws-sdk');
const BUCKET_NAME = 's3-001bucket';
const s3 = new AWS.S3({accessKeyId: 'AKIA6RKMBHZQTUOSXPN5',
secretAccessKey:'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'});
const uploadFile = (fileName) => {
  const fileContent = fs.readFileSync(fileName);
       const params = {
               Bucket: 's3-001bucket',
               Key: 'app_review_android.csv',
               Body: fileContent
       };
       s3.upload(params, function(err, data){
         if (err) {throw err;}
         console.log(`File uploaded successfully. ${data.Location}`);
       });
};
uploadFile('app_review_android.csv');
