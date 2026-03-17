const http = require('http');

http.get('http://localhost:3000/api/courses/all', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const courses = JSON.parse(data);
      console.log('TOTAL COURSES:', courses.length);
      console.log('ACTIVE COURSES:', courses.filter(c => c.active).map(c => c.name));
      console.log('STAGING COURSES:', courses.filter(c => !c.active).map(c => c.name));
    } catch (e) {
      console.error('PARSE ERROR:', e.message);
      console.log('RAW DATA:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('FETCH ERROR:', err.message);
});
