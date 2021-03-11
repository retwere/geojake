const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "app/lib"),
    publicPath: "/lib/",
    filename: "bundle.js"
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: "awesome-typescript-loader"
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "app/index.html",
      template: "src/index.ejs"
    })
  ],
  devServer: {
    index: "app/index.html",
    publicPath: "/lib/",
    contentBase: path.resolve(__dirname, "app"),
  },
};
