const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin")
  .default;
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
// var HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  devServer: {
    contentBase: "./",
  },
  output: {
    path: __dirname + "/_build",
    filename: "bundle.js",
  },
  resolve: {
    alias: {
      jquery: "jquery/src/jquery",
    },
  },
  module: {
    rules: [
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
      {
        test: /script\.js$/,
        use: ["script-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/template.ejs",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    new CopyPlugin({
      patterns: [
        {from:'images', to:'images'},
        {from:'dtpr_icons', to:'dtpr_icons'},
      ]
    })
  ],
  devServer: {
    contentBase: path.join(__dirname, ""),
    compress: true,
    port: 9000,
  },
};
