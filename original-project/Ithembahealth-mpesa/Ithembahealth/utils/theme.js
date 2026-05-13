var app = getApp ? getApp() : null;
function theme() { return (app && app.globalData && app.globalData.theme) ? app.globalData.theme : {
  primary:"#23b0d3", secondary:"#66905e", background:"#ffffff", appbarBg:"#23b0d3", drawerBg:"#ffffff"
};}
module.exports = { theme: theme };
