/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.2.
 ** Copyright (c) 2000-2019 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/
const YWorksOptimizer = require("@yworks/optimizer/webpack-plugin");

module.exports = {
  publicPath: process.env.PUBLIC_PATH || './',
  productionSourceMap: false,
  configureWebpack: {
    plugins:
      process.env.NODE_ENV !== "production"
        ? []
        : [
            new YWorksOptimizer({
              logLevel: "info",
              blacklist: [
                "render",
                "template",
                "show",
                "properties",
                "content",
                "active",
                "contains",
                "content",
                "cropLength",
                "dispose",
                "end",
                "findIndex",
                "from",
                "getData",
                "getValue",
                "graphComponent",
                "hide",
                "invalid",
                "list",
                "mode",
                "nodeIds",
                "normalize",
                "operation",
                "originalEvent",
                "removeItem",
                "render",
                "resources",
                "root",
                "currentItem",
                "setSize",
                "setValue",
                "show",
                "showMenu",
                "to",
                "types",
                "update",
                "vertical",
                "visible",
                "Workarounds",
                "EdgeType",
                "getIcon",
                "eventType",
                "selectedNodes",
                "isOpen",
                "orientation",
                "layoutStyle",
                "optimizationStrategy",
                "command",
                "nodeCount",
                "coordinates",
                "getPosition",
                "applyLayout",
                "openFile",
                "simpleMode",
                "horizontalAlignment",
                "verticalAlignment",
                "empty",
                "cancel",
                "edgeCount",
                "DASH",
                "merge",
              ],
            }),
          ],
  },
  chainWebpack: (config) => {
    /** the yFiles library files are ES5 compatible and don't need to be babeled explicitly */
    config.module.rule("js").exclude.add(/es-modules/);
    if (process.env.NODE_ENV !== "production") {
      config.entry("app").prepend(
        // Add yFiles debugging support for development build
        "./yfiles-typeinfo.js"
      );
    }
  },
  css: {
    loaderOptions: {
      postcss: {
        config: {
          path: "./postcss.config.js", // don't search for postcss config outside this demo folder
        },
      },
    },
  },
};
