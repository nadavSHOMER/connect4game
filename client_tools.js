function sendHttpGetRequest(url, callback){
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = ()=>{
        if(httpRequest.readyState == 4){
            if(httpRequest.status == 200){
                callback(httpRequest.responseText);
            }
        }
    };
    httpRequest.open("GET", url, true);
    httpRequest.send();

}