const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "app"),
    publicPath: "/",
    filename: "app.js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "src/index.ejs",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
  devServer: {
    index: "index.html",
    publicPath: "/",
    contentBase: path.resolve(__dirname, "app"),
  },
};
