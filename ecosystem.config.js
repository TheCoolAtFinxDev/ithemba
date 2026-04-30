module.exports = {
  apps: [{
    name: 'ithemba-api',
    script: './apps/api/dist/main.js',
    cwd: '/home/developer/ithemba',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
    }
  }]
};
