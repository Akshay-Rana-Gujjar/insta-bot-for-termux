var dns = require("dns");
const { IgApiClient } = require("instagram-private-api");
var fs = require("fs");
var { promisify } = require("util");
var jimp = require("jimp");
var imagepath;
var log = console.log;
var profileIndexFromCLI = process.argv[2];
var config = require("./config")[profileIndexFromCLI];
var { exec } = require("child_process");
var inquirer = require("inquirer");
var SESSION_PATH = __dirname+"/sessions";


function sendNotification(text) {
    exec(`termux-notification -c '${text}'`);
}

if (!config) {
    sendNotification("Check config.js for index");
    return;
}

const IG_USERNAME = config.USERNAME, IG_PASSWORD = config.PASSWORD;
const IMAGE_PATH_DIR = config.IMAGEPATHDIR;

process.env["config.seed"] = `${IG_USERNAME}-seed`;

const igc = new IgApiClient();

const saveSession = async (data, username) => {
    if (!fs.existsSync(SESSION_PATH)) {
        fs.mkdirSync(SESSION_PATH);
    }

    fs.writeFileSync(`${SESSION_PATH}/${username}.json`, JSON.stringify(data), { encoding: "utf8" });
};

const loadSession = async (username) => {
    log("reading file...");
    const sessionFile = fs.readFileSync(`${SESSION_PATH}/${username}.json`, "utf8");
    await igc.simulate.preLoginFlow();
    log("loading session...");
    await igc.state.deserialize(sessionFile);
    process.nextTick(async () => await igc.simulate.postLoginFlow());
    igc.request.end$.subscribe(async () => {
        const serialized = await igc.state.serialize();
        delete serialized.constants;
        log("saving session state...");
        await saveSession(serialized, username);
    });
    const pk = igc.state.cookieUserId;
    log("session loaded...");
    return pk;
};

const newLogin = async (data) => {
    const userCred = data;
    await igc.simulate.preLoginFlow();
    log("Loging in...");
    try {

        const auth = await igc.account.login(userCred.username, userCred.password);
        process.nextTick(async () => await igc.simulate.postLoginFlow());
        igc.request.end$.subscribe(async () => {
            const serialized = await igc.state.serialize();
            delete serialized.constants;
            log("saving login state...");
            await saveSession(serialized, userCred.username);
        });
        log("user logged in...");
        return auth.pk;
    } catch (error) {
        sendNotification("Error while login");
        throw new Error(error);
    }
};


var loginFlow = async (data) => {
    log("Checking file....");
    const igSession = fs.existsSync(`${SESSION_PATH}/${data.username}.json`);
    if (igSession) {
        log("File found! \nLoadind Session... ");
        const auth = await loadSession(data.username); // load session by username
        return auth;
    } else {
        log("File Not Found, Login...");
        const auth = await newLogin(data);
        return auth;
    }
};

var login = async function login1() {
    log("generating device...");
    igc.state.generateDevice(IG_USERNAME);
    await igc.simulate.preLoginFlow();
    log("Device generated, loging in.....");
    try {

        await loginFlow({ username: IG_USERNAME, password: IG_PASSWORD });

    } catch (error) {

        log(error);
        // console.log(igc.state.checkpoint); // Checkpoint info here
        // await igc.challenge.auto(true); // Requesting sms-code or click "It was me" button
        // console.log(igc.state.checkpoint); // Challenge info here
        // const { code } = await inquirer.prompt([
        //     {
        //         type: 'input',
        //         name: 'code',
        //         message: 'Enter code',
        //     },
        // ]);
        // var status = await igc.challenge.sendSecurityCode(code);

        // if (status.status == "ok") {
        //     return;
        // } else {
        sendNotification("Error While login");
        throw new Error(error);
        // }
    }

};

function publishAndCropImage(fileName, cb) {

    jimp.read(fileName)
        .then(async img => {
            var width = img.getWidth();
            var height = img.getHeight();
            var newHeight = width * 1.25; // 4:5 aspect ratio for insta image
            var originalImgeRatio = width / height;
            var instaImageRatio = 0.8;

            log("calling....");

            log("calling login()");
            await login();

            if (originalImgeRatio < instaImageRatio) {
                log("Cropping...");
                img.crop(0, 0, width, newHeight, async function (err, croppedImage) {
                    // await croppedImage.writeAsync(imageName);
                    var bufferImage = await croppedImage.getBufferAsync(jimp.MIME_JPEG);
                    publishImage(bufferImage);
                });
            }
            else {
                var bufferImage = await img.getBufferAsync(jimp.MIME_JPEG);
                publishImage(bufferImage);
            }


        })
        .catch(err => {
            console.log(err);
        });

}

async function publishImage(bufferImage) {
    log("Uploading...");
    try {
        const publishResult = await igc.publish.photo({
            // read the file into a Buffer
            file: bufferImage,
            caption: config.CAPTION + config.HASHTAGS

        });

        log(publishResult);
        if (publishResult.status == "ok") {
            fs.unlinkSync(imagepath);
            sendNotification("Image Published on " + IG_USERNAME);
        }
    } catch (error) {
        log(error);
        return sendNotification("Error while publishing...");
    }


}

async function getImageFile() {

    if (!fs.existsSync(IMAGE_PATH_DIR)) {
        fs.mkdirSync(IMAGE_PATH_DIR);
        sendNotification(IMAGE_PATH_DIR + " Created");
        throw new Error(IMAGE_PATH_DIR + " Created");
    }

    var files = await fs.promises.readdir(IMAGE_PATH_DIR);

    if (!files.length) {
        sendNotification("Directory Empty!");
        throw new Error("Directory Empty!");
    }

    var file = IMAGE_PATH_DIR + "/" + files[0];

    log(file + " file found.");

    return file;

}

// (async () => {

//     if(checkInternetConnection()){
//         imagepath = await getImageFile();
//         publishAndCropImage(imagepath);
//     }

// })();


async function checkInternetConnection() {
    var pormiseDNSResolve = promisify(dns.resolve);
    try {
        var i = await pormiseDNSResolve('www.google.com');

        return true;
    } catch (error) {
        log(error);
        sendNotification("No Internet!");
        return false;
    }

}

(async function () {

    if (await checkInternetConnection()) {
        imagepath = await getImageFile();
        publishAndCropImage(imagepath);
    }

})();