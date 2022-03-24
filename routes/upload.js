const fs = require('fs');
const AWS = require('aws-sdk');
const BUCKET_NAME = 's3-001bucket';
const s3 = new AWS.S3({accessKeyId: 'AKIA6RKMBHZQTUOSXPN5',secretAccessKey: 'u9+9BwU4Zeyz    PoCY058h3Xua+Mmf/QZnnLTB05g5'});

var connection = mysql.createConnection({
  host     : 'mymysql.csstqmpesreg.ap-northeast-2.rds.amazonaws.com',
  user     : 'admin',
  password : 'abcd1234',
  database : 'avo_review'
});

const uploadFile = (fileName) => {
       const fileContent = fs.readFileSync(fileName);
       const params = {
               Bucket: BUCKET_NAME,
               Key: 'axios.png',
               Body: fileContent
       };
       s3.upload(params, function(err, data){
         if (err) {throw err;}
         console.log(`File uploaded successfully. ${data.Location}`);
       });
};
uploadFile('../../revolution/logo.png');
