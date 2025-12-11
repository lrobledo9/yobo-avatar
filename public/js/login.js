
let accessToken = '';
login = async () => {
    const username = localStorage.getItem('username');
    try {
        const response = await fetch(`${CONFIG.baseUrl}/v1/login/authorization`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "user": username
                })
            }
        );
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        accessToken = data.data.accesstoken;
        await credentials();
        await credentialsAWS(); 
    } catch (error) {
        return null;
    }
}

getAccessToken = async () => {
    return accessToken;
}

let accessTokenN8n = '';
let accessKeyAzure = {};
let accessAws = {};
credentials = async () => {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/v1/login/credentials/meet`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        accessTokenN8n = data.data.n8n.token;
        accessKeyAzure = data.data.azure;
    } catch (error) {
        return null;
    }

}

credentialsAWS = async () => {

    try {
        const response = await fetch(`${CONFIG.baseUrl}/v2/login/credentials`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        accessAws = data;
    } catch (error) {
        return null;
    }


}  


getAccessTokenN8n = () => {
    return accessTokenN8n;

}
getAccessKeyAzure = () => {
    return accessKeyAzure;

}
getAccessAws = () => {
    return accessAws;

}