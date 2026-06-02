const { plexToken, plexUrl } = require("../configs");
const axios = require("axios");

exports.refreshAll = async () => {
    const response = await axios.get(
        `${plexUrl}/library/sections/all/refresh`,
        {
            params: {
                "X-Plex-Token": plexToken
            },
            timeout: 10000
        }
    );
    console.log("Plex refresh response:", response.status, response.data);
    return {
        success: true,
        status: response.status
    };
};