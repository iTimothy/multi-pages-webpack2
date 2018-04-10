var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var fs = require('fs');
var minimist = require('minimist');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var serve = require('webpack-serve');
var proxy = require('http-proxy-middleware');
var kc = require('koa-connect');
var Router = require('koa-router');

process.noDeprecation = true

String.prototype.trim = function() {
    return this.replace(/(^\s*)|(\s*$)/g, '');
}
var argv = require('minimist')(process.argv.slice(2));

var router = new Router();

var proxyOptions = {
    target: 'http://test.com',
    changeOrigin: true,
    pathRewrite: {
        "^/api/*": "^/new/*"
    }
};

router.get('*', kc(proxy(proxyOptions)));


module.exports = function(environment) {
    var files = [];
    var root = 'projects'; //项目总目录
    var env = argv.env
    var src = env.src.trim();
    var projectName = src;
    var mode = env.mode;
    var isProd = env.mode === 'prod'; //运行模式
    var publicPath = env.ph && env.ph.toString().trim()
    var ScanDir = function(path) {
        var that = this
        if (fs.statSync(path).isFile()) {
            return files.push(path)
        }
        try {
            fs.readdirSync(path).forEach(function(file) {
                ScanDir.call(that, path + '/' + file)
            })
        } catch (e) {}
    };

    var projectList = fs.readdirSync('./' + root);
    if (projectList.indexOf(src) < 0) {
        console.error('project not found');
        process.exit();
    }

    var project = path.join(__dirname, root, src);
    var pageConfigFile = path.join(project, 'src', 'page.js');

    var isExists = fs.existsSync(pageConfigFile);
    if (!isExists) {
        console.error('page.js not found!');
        process.exit()
    }

    var pageConfig = require(pageConfigFile);


    ScanDir(path.join(project, 'src'));

    var sourceList = {
        jsList: {},
        imgList: {},
        scssList: {},
        cssList: {},
        htmlList: {}
    };

    var jsStr = 'src/js/',
        strLen = jsStr.length;
    files.map((item, i) => {

        var extname = path.extname(item);
        var basename = path.basename(item, extname);

        switch (extname) {
            case '.js':
                var temp = item.substring(item.indexOf(jsStr) + strLen);
                var entryJs = temp.substring(0, temp.indexOf(extname));
                sourceList.jsList[entryJs] = item;
                break;
            case '.gif':
                sourceList.imgList[basename] = item;
                break;
            case '.jpg':
                sourceList.imgList[basename] = item;
                break;
            case '.png':
                sourceList.imgList[basename] = item;
                break;
            case '.jpeg':
                sourceList.imgList[basename] = item;
                break;
            case '.scss':
                sourceList.scssList[basename] = item;
                break;
            case '.css':
                sourceList.cssList[basename] = item;
                break;
            case '.html':
                sourceList.htmlList[basename] = item;
                break;
        }
    });

    var isDevProd = mode === 'devprod'

    var dist = path.join(__dirname, root, projectName);
    var projectSrc = path.join(__dirname, root, projectName, 'src/');

    var extractCSS = new ExtractTextPlugin('css/[name].css');
    var extractSASS = new ExtractTextPlugin('css/[name].css');

    var plugins = [];
    var entryObj = {};

    if (isProd) {
        plugins.push(new UglifyJSPlugin())
    }
    plugins.push(extractCSS);
    plugins.push(extractSASS);
    plugins.push(new webpack.NamedModulesPlugin())
    plugins.push(new webpack.HotModuleReplacementPlugin())

    pageConfig.map(function(item, i) {
        pageConfig[i].template = projectSrc + pageConfig[i].template;
        pageConfig[i].chunks.map(function(_item, _i) {
            if (entryObj[_item] != sourceList.jsList[_item]) {
                entryObj[_item] = sourceList.jsList[_item]
            }
        })
        plugins.push(new HtmlWebpackPlugin(pageConfig[i]));
    });
    var ret = {
        entry: entryObj,
        mode: isProd ? 'production':'development',
        output: {
            path: dist,
            filename: "js/[name].js",
            chunkFilename: "js/[chunkhash].js",
            publicPath: (isProd || isDevProd) ? (publicPath === 'true' ? ('/acts/projects/' + projectName + '/') : ((publicPath !== '' && publicPath) ? publicPath + '/' : '/acts/projects/' + projectName + '/')) : '/'
        },
        resolve: {
            extensions: ['.coffee', '.js', '.es6', '.css', '.scss', '.png', '.jpg', '.jpeg', '.gif']
        },
        module: {
            rules: [{
                test: /\.css$/,
                loader: extractCSS.extract(['css-loader', 'postcss-loader'])
            }, {
                test: /\.ejs$/,
                use: {
                    loader: 'ejs-compiled-loader',
                    options: {
                        'htmlmin': false,
                        'htmlminOptions': {
                            removeComments: false
                        },
                        query: path.join(projectSrc, 'views/')
                    }

                }

            }, {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015', 'stage-2'],
                        cacheDirectory: '',
                        plugins: ["transform-runtime"]
                    }
                }
            }, {
                test: /\.scss$/,
                loader: extractSASS.extract(['css-loader', 'postcss-loader']),
                exclude: /node_modules/
            }
            , {
                test: /\.(png|gif|jpe?g|svg|eot|ttf|woff|woff2)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 8192,
                        name: 'images/[name].[ext]?[hash:8]'
                    }
                }]
            }
            ]
        },
        devtool: (isProd && !isDevProd) ? '' : 'source-map',
        plugins: plugins
        
        // ,devServer: {
        //     contentBase: dist,
        //     outputPath: dist,
        //     colors: true,
        //     progress: true,
        //     port: 8090,
        //     proxy: {
        //         '/kkapi': {
        //             target: 'http://192.168.1.240/',
        //             pathRewrite: {
        //                 '^/kkapi': '/kkapi'
        //             },
        //             changeOrigin: true
        //         }
        //     },
        //     devtool: (isProd && !isDevProd) ? '' : 'source-map'
        // }
    }
    if(!isProd && !isDevProd){
        ret['serve'] = {
            hot: false,
            add: function(app, middleware, options){
                middleware.webpack();
                middleware.content();
                app.use(router.routes());
              }
        };
    }
    return ret
}