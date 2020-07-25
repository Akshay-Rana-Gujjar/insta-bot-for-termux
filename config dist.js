var os = require("os");
var homeDir = os.homedir();
var DIR_SUFFIX = "/storage/music";
var FULL_DIR_PATH = homeDir + DIR_SUFFIX;
var PROFILES = [
            "username 1",
            "username 2",
            "username 3",
            "username 4"
        ];

var USER_PROFILES =
    [
        {
            USERNAME: PROFILES[0],
            PASSWORD: "password 1",
            IMAGEPATHDIR: FULL_DIR_PATH + "/images",
            CAPTION: `FOLLOW @${PROFILES[0]} FOR MORE AMAZING POSTS`,
            HASHTAGS: "#hashtag1 #hashtag2",//insta allow 30 hashtags,

        },
        {
            USERNAME: PROFILES[1],
            PASSWORD: "password 1",
            IMAGEPATHDIR: FULL_DIR_PATH + "/" + PROFILES[1],
            CAPTION: `FOLLOW @${PROFILES[1]} FOR MORE AMAZING POSTS`,
            HASHTAGS: "#hashtag1 #hashtag2",//insta allow 30 hashtags,

        },
        {
            USERNAME: PROFILES[2],
            PASSWORD: "password 1",
            IMAGEPATHDIR: FULL_DIR_PATH + "/"+PROFILES[2],
            CAPTION: `FOLLOW @${PROFILES[2]} FOR MORE AMAZING POSTS`,
            HASHTAGS: "#hashtag1 #hashtag2",//insta allow 30 hashtags

        },
        {
            USERNAME: PROFILES[3],
            PASSWORD: "password 1",
            IMAGEPATHDIR: FULL_DIR_PATH + "/"+PROFILES[3],
            CAPTION: `FOLLOW @${PROFILES[3]} FOR MORE AMAZING POSTS`,
            HASHTAGS: "#hashtag1 #hashtag2",//insta allow 30 hashtags

        }

    ];
console.log(PROFILES.map((v, i)=>i+" = "+v));

module.exports = USER_PROFILES;
