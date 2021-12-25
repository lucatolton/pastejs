$(document).ready(function() {
    //setTimeout(() => console.clear(), 500)
    $.ajax({
        url: '/api/version',
        type: 'GET',
        success: function(data) {
            document.getElementById('pastejs_ver').innerHTML = data.version;
        }
    });
});

function createPaste(visibility) {
    let title = $('#paste_title').val();
    let content = $('#paste_content').val();

    if (!title || title.length === 0) return;
    if (!content || content.length === 0) return;

    console.log('making paste');
    
    $.ajax({
        url: '/api/pastes',
        type: 'POST',
        data: {
            title: title,
            content: content,
            visibility: visibility
        },
        success: function(data) {
            window.location.href = '/paste/' + data._id;
        }
    });
}

function getRecentPastes() {
    $.ajax({
        url: '/api/pastes/recent/public',
        type: 'GET',
        success: function(data) {
            let html = '';
            data.forEach(paste => {
                html += `<div class="col-12 col-md-6 col-lg-4 mb-5">
                <div class="card bg-primary shadow-soft text-center border-light">
                    <div class="card-header">
                        <span class="card-text small"><span class="far fa-calendar-alt mr-2"></span>${timeSince(new Date(paste.createdAt))}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="h5 card-title">${paste.title}</h3>
                        <p class="card-text">${paste.content.substring(0, 30)}</p>
                        <a href="/paste/${paste._id}" class="btn btn-primary btn-sm">View</a>
                    </div>
                    <div class="card-footer">
                        <a href="/user/1">
                            <span class="far fa-user"></span> ${paste.user.name}
                        </a>
                    </div>
                </div>
            </div>`;
            });
            if (html.length > 0) $('#recent_pastes').html(html);
            else $('#recent_pastes').html('<h4 class="text-center">No public pastes</h4>');
        }
    });
}

function getOwnPastes() {
    $.ajax({
        url: '/api/pastes/currentuser',
        type: 'GET',
        success: function(data) {
            let html = '';
            data.forEach(paste => {
                html += `<div class="col-12 col-md-6 col-lg-4 mb-5">
                <div class="card bg-primary shadow-soft text-center border-light">
                    <div class="card-header">
                        <span class="card-text small"><span class="far fa-calendar-alt mr-2"></span>${timeSince(new Date(paste.createdAt))}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="h5 card-title">${paste.title}</h3>
                        <p class="card-text">${paste.content.substring(0, 30)}</p>`;
                if (paste.visibility === 'public') {
                    html +=`<a href="#" class="badge badge-success">Public</a><br /><br />`;
                }
                if (paste.visibility === 'unlisted') {
                    html += `<a href="#" class="badge badge-info">Unlisted</a><br /><br />`
                }
                if (paste.visibility === 'private') {
                    html +=`<a href="#" class="badge badge-danger">Private</a><br /><br />`;
                }
                html += `<a href="/paste/${paste._id}" class="btn btn-primary btn-sm">View</a>
                    </div>
                </div>
            </div>`;
            });
            if (html.length > 0) $('#own_pastes').html(html);
            else $('#own_pastes').html('<h4 class="text-center">You have no pastes</h4>');
        }
    });
}

function deletePaste(id) {
    console.log('deleting paste');
    $.ajax({
        url: '/api/pastes/' + id,
        type: 'DELETE',
        success: function(data) {
            window.location.href = '/paste/your';
        }
    });
}

function timeSince(timeStamp) {
    var now = new Date(),
    secondsPast = (now.getTime() - timeStamp) / 1000;
    if (secondsPast < 60) {
        return parseInt(secondsPast) + 's ago';
    }
    if (secondsPast < 3600) {
        return parseInt(secondsPast / 60) + 'm ago';
    }
    if (secondsPast <= 86400) {
        return parseInt(secondsPast / 3600) + 'h ago';
    }
    if (secondsPast > 86400) {
        day = timeStamp.getDate();
        month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
        year = timeStamp.getFullYear() == now.getFullYear() ? "" : " " + timeStamp.getFullYear();
        return day + " " + month + year;
    }
}

function authRedirect() {
    window.location.href = '/api/auth/login';
}
