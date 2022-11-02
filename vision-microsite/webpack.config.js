const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin")
  .default;
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
// var HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = {
  mode: "development",
  // watch: true,
  // watchOptions: {
  //   poll: true,
  //   ignored: /node_modules/,
  // },
  entry: "./src/index.js",
  devServer: {
    contentBase: "./",
    // inline: true,
    // hot: true,
    // watchOptions: {
    //   aggregateTimeout: 300,
    //   poll: true,
    // },
  },
  output: {
    path: __dirname + "./../app/public/vision",
    filename: "bundle.js",
  },
  resolve: {
    alias: {
      jquery: "jquery/src/jquery",
    },
  },
  module: {
    rules: [
      // {
      //   test: /\.html$/i,
      //   use: {
      //     loader: "html-loader",
      //     options: {
      //       attrs: [":data-src"],
      //     },
      //   },
      // },

      // {
      //   test: /\.scss$/,
      //   use: ExtractTextPlugin.extract({
      //     use: ["css-loader", "sass-loader"],
      //   }),
      // },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            // options: {
            //   hmr: true,
            // },
          },
          { loader: "css-loader", options: { url: false, sourceMap: false } },
          { loader: "sass-loader", options: { sourceMap: false } },
        ],
      },
      // {
      //   test: /\.(png|jpe?g|gif|svg)$/i,
      //   use: [
      //     {
      //       loader: "file-loader",
      //       options: {
      //         name: "./images/[name].[hash].[ext]",
      //       },
      //     },
      //   ],
      // },
      // {
      //   test: /\.svg$/,
      //   use: [{ loader: "svg-inline-loader" }],
      // },
      // {
      //   test: /\.html$/,
      //   use: [
      //     {
      //       loader: "ejs-loader",
      //     },
      //     {
      //       loader: "extract-loader",
      //     },
      //     {
      //       loader: "html-loader",
      //       options: {
      //         interpolate: true,
      //       },
      //     },
      //   ],
      // },
      // { test: /\.ejs$/, use: [{ loader: "ejs-loader" }] },
      {
        test: /script\.js$/,
        use: ["script-loader"],
      },
    ],
  },
  plugins: [
    // new CleanWebpackPlugin({
    //   cleanStaleWebpackAssets: false,
    //   cleanOnceBeforeBuildPatterns: ["*.*", "!images*"],
    //   cleanAfterEveryBuildPatterns: ["*.*", "!images*"],
    // }),
    new HtmlWebpackPlugin({
      template: "./src/template.ejs",
    }),
    // new ExtractTextPlugin("styles.css"),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    // new HTMLInlineCSSWebpackPlugin(),
    // new webpack.ProvidePlugin({
    //   $: "jquery",
    //   jQuery: "jquery",
    // }),
    // new HtmlWebpackInlineSourcePlugin(),
  ],
  devServer: {
    contentBase: path.join(__dirname, ""),
    compress: true,
    port: 9000,
  },
};
