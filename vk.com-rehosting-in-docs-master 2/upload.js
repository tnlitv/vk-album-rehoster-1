/*global chrome, alert, XMLHttpRequest, FormData, document, window, setTimeout */


function thereIsAnError(textToShow, errorToShow, imageUrl) {
    "use strict";

    document.getElementById('wrap').innerHTML = '<p></p><br/><br/><center><h1>Wow! Some error arrived!</h1></center><br/><br/><p>' + textToShow + '</p><br/><br/><p>' + errorToShow + '</p><p>' + imageUrl + '</p>';
}

/*make window visible or hide*/
function show(state){	
		document.getElementById('window').style.display = state;            
		document.getElementById('wrap').style.display = state;
}
    
/**
 * Main function to upload an image
 *
 * @param  {string} imageUrl URL of the uploaded image
 * @param  {string} fileName Name of the new uploaded file on VK documents
 * @param  {string} accToken Access token with vk authentication permissions
 */
function upload(imageUrl, fileName, accToken, userId) {
	    
    var uploadHttpRequest = new XMLHttpRequest();

    uploadHttpRequest.onload = function () {
	    
    var getAlbumsRequest = new XMLHttpRequest();
    getAlbumsRequest.open('GET', 'https://api.vk.com/method/photos.getAlbums?owner_id=' + userId);
	
    getAlbumsRequest.onload = function () {
	
        var answer = JSON.parse(getAlbumsRequest.response);

    	if (answer.error !== undefined) {
             chrome.storage.local.remove('vkaccess_token');
            document.getElementById('wrap').innerHTML = '<p></p><br/><br/><center><h1>Ops. Something went wrong. Please try again.</h1></center><br/>';
            setTimeout(function () { window.close(); }, 3000);
            return;
    	}
	
		function addElemsToSelectBox(){
			var x = document.getElementById("select_album");

			for(var i = 0; i < answer.response.length; ++i){
			    var option = document.createElement("option");
				    
				option.text = answer.response[i].title;
				x.add(option);
		}
	}
		
		    
	addElemsToSelectBox();
	show('block');
	document.getElementById("btnSend").addEventListener("click", 
	
	function(){
		function getAlbumIdAndStuff(){
			var x = document.getElementById("select_album");
			 
			var albumId = answer.response[x.selectedIndex].aid;
  
			show('none');

		    var albumUploadServer = new XMLHttpRequest(),
		        requestFormData,
		        albumUploadRequest;

		    albumUploadServer.open('GET', 'https://api.vk.com/method/photos.getUploadServer?access_token=' + accToken +'&album_id=' + albumId);

		    albumUploadServer.onload = function () {
				    
		        var answer = JSON.parse(albumUploadServer.response);
 
		        if (answer.error !== undefined) {
		            chrome.storage.local.remove('vkaccess_token');
		            document.getElementById('wrap').innerHTML = '<p></p><br/><br/><center><h1>Ops. Something went wrong. Please try again.</h1></center><br/>';
		            setTimeout(function () { window.close(); }, 3000);
		            return;
		        }

		        if (answer.response.upload_url === undefined) {
		            thereIsAnError('albumUploadServer response problem', answer, imageUrl);
		            return;
		        }

		        requestFormData = new FormData();
		        albumUploadRequest = new XMLHttpRequest();

		        requestFormData.append("file", uploadHttpRequest.response, fileName);

		        albumUploadRequest.open('POST', answer.response.upload_url, true);

		        albumUploadRequest.onload = function () {
		            var answer = JSON.parse(albumUploadRequest.response),
		                albumSaveRequest;
		                
		            if (answer.photos_list === undefined) {
		                thereIsAnError('Upload blob problem response problem', answer.toString, imageUrl);
		                return;
		            }

		            albumSaveRequest = new XMLHttpRequest();

		            albumSaveRequest.open('GET', 'https://api.vk.com/method/photos.save?access_token=' + accToken +'&server=' + answer.server +
		            '&photos_list=' + answer.photos_list + "&hash=" + answer.hash + "&album_id=" + albumId);

		            albumSaveRequest.onload = function () {

		                var answer = JSON.parse(albumSaveRequest.response);

		                if (answer.response[0].pid === undefined) {
		                    thereIsAnError('albumSaveRequest - no file in response', answer, imageUrl);
		                    return;
		                }
		                    
		                document.getElementById('wrap').innerHTML = '<p></p><br/><br/><center><h1>Successfully uploaded!</h1></center><br/>';
		                setTimeout(function () { window.close(); }, 3000);
		            };
		            albumSaveRequest.send();
		        };
		        albumUploadRequest.send(requestFormData);
		    };
		    albumUploadServer.send();
    }
    getAlbumIdAndStuff();
    });
    };
    
    getAlbumsRequest.send();
};


uploadHttpRequest.responseType = 'blob';
    uploadHttpRequest.open('GET', imageUrl);
    uploadHttpRequest.send();
}


		
/**
 * Add a listener for DOMContentLoaded event
 *
 * @param {string}   Event name
 * @param {function} Event handler
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    var params   = window.location.hash.substring(1).split('&'),
        imageUrl = null,
        filename,
        imageName;
         
    if (params === undefined || params.length ===  undefined || params.length !== 3) {
        thereIsAnError('Parsing image url', 'params || params.length != 3', imageUrl);
        return;
    }

    filename = params[0].split('/');

    if (filename.length === undefined || filename.length === 0) {
        thereIsAnError('Getting image filename', 'filename.length <= 0', imageUrl);
        return;
    }

    imageUrl = params[0];

    imageName = filename[filename.length - 1];

    if (imageName.indexOf('?') > -1) {
        imageName = imageName.slice(0, imageName.indexOf('?'));
    }

    if (imageName.indexOf('#') > -1) {
        imageName = imageName.slice(0, imageName.indexOf('#'));
    }

    if (imageName.indexOf('&') > -1) {
        imageName = imageName.slice(0, imageName.indexOf('&'));
    }
        

    upload(imageUrl, imageName, params[1], params[2]);
});
