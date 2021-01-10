const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CheckerPlugin } = require("awesome-typescript-loader");
const sourceRootPath = path.join(__dirname, "src");
const distRootPath = path.join(__dirname, "dist");

module.exports = {
  entry: {
    popup: path.join(sourceRootPath, "popup", "index.tsx"),
    mainEvent: path.join(sourceRootPath, "events", "mainEvent.ts"),
    auth: path.join(sourceRootPath, "events", "auth.ts"),
    content: path.join(sourceRootPath, "content.ts"),
  },
  output: {
    path: distRootPath,
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)?$/,
        loader: "awesome-typescript-loader",
        exclude: /node_modules/,
      },

      {
        test: /\.(ttf|eot|svg)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "fonts/[hash].[ext]",
          },
        },
      },
      {
        test: /\.(woff|woff2)$/,
        use: {
          loader: "url-loader",
          options: {
            name: "fonts/[hash].[ext]",
            limit: 5000,
            mimetype: "application/font-woff",
          },
        },
      },
      {
        exclude: /node_modules/,
        test: /\.(scss|css)$/,
        use: [
          {
            loader: "style-loader", // Creates style nodes from JS strings
          },
          {
            loader: "css-loader", // Translates CSS into CommonJS
          },
          {
            loader: "sass-loader", // Compiles Sass to CSS
          },
        ],
      },
    ],
  },
  plugins: [
    new CheckerPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(sourceRootPath, "html", "popup.html"),
      inject: "head",
      title: "Mercury",
      filename: "popup.html",
      chunks: ["popup"],
      cache: false,
    }),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(sourceRootPath, "images"),
          to: path.join(distRootPath, "images"),
          test: /\.(jpg|jpeg|png|gif|svg)?$/,
        },
        {
          from: path.join(sourceRootPath, "manifest.json"),
          to: path.join(distRootPath, "manifest.json"),
          toType: "file",
        },
      ],
      {
        copyUnmodified: true,
      }
    ),
    new CleanWebpackPlugin(),
  ],
};
