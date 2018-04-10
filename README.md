## 多项目多页面webpack2脚手架

### directory
- root
    - projects    
        - project1(目录下除src都是构建后的文件)
            - src (dev 目录)
                - images (图片)
                - css (css文件)
                - js (js文件)
                - views (模版页面)
                - page.js (模版页面配置) 
            - images (dist)
            - js (dist)
            - css (dist)
            - demo.html (dist)
        - project2
        - ...
- webpack.config.js
- postcss.config.js
- package.json
- .babelrc

### Usage

```bash
npm install

# dev
window: 
npm run dev -- --env.src=example --env.ph=publicpath
# devbuild 
#### dev build
npm run devbuild -- --env.src=example
or
npm run devbuild -- --env.src=example --env.ph=publicpath
# build
#### production build
npm run build -- --env.src=example
or
npm run build -- --env.src=example --env.ph=publicpath
```
### page.js
``` js
module.exports = [
    {
        title: "demo",//page title
        filename: "index.html",
        template: "views/index.ejs", //page template
        chunks:["lib/g","index"],//page entry
        hash: true,
        cache: true
    }
];
```
[page.js more configuration](https://github.com/ampedandwired/html-webpack-plugin#configuration,"page.js configuration")

### 修改 ejs-compiled-loader>index.js
``` js
var ejs = require('ejs'),
  uglify = require('uglify-js');

module.exports = function (source) {
  this.cacheable && this.cacheable();
  var template = ejs.compile(source, {
    client: true,
    filename: this.context,
    webpack: this
  });

  var ast = uglify.parser.parse(template.toString());

  return 'module.exports = ' + uglify.uglify.gen_code(ast, {beautify: true});
};

```

### License
MIT (http://www.opensource.org/licenses/mit-license.php)