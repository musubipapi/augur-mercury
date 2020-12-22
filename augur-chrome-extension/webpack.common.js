const path = require("path");

module.exports = {
  entry: {
    popup: path.join(__dirname, "src/popup/index.tsx"),
    mainEvent: path.join(__dirname, "src/events/mainEvent.ts"),
    auth: path.join(__dirname, "src/events/auth.ts"),
    content: path.join(__dirname, "src/content.ts"),
  },
  output: {
    path: path.join(__dirname, "dist/js"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader",
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
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
};
