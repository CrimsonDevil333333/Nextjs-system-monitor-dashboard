const si = require('systeminformation');
si.dockerContainerStats('*').then(data => {
    console.log(JSON.stringify(data[0] || {}, null, 2));
}).catch(e => console.error(e));
