export const templateEngine = function (tpl, data, regex) {
  var re = regex,
    match;
  while ((match = re.exec(tpl))) {
    tpl = tpl.replace(match[0], data[match[1]]);
  }
  return tpl;
};
