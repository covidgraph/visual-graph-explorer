<template>
  <v-menu
    v-model="showMenu"
    :absolute="true"
    :close-on-content-click="true"
    :position-x="positionX"
    :position-y="positionY"
    :offset-x="offsetX"
    :offset-y="offsetY"
  >
    <slot></slot>
  </v-menu>
</template>

<script>
import { detectiOSVersion, detectSafariVersion } from "../util/Workarounds";

function getCenterInPage(element) {
  let left = element.clientWidth / 2.0;
  let top = element.clientHeight / 2.0;
  while (element.offsetParent) {
    left += element.offsetLeft;
    top += element.offsetTop;
    element = element.offsetParent;
  }
  return { x: left, y: top };
}

export default {
  name: "ContextMenu",
  data: () => ({
    offsetX: false,
    offsetY: false,
    positionX: 0,
    positionY: 0,
    showMenu: false,
  }),
  watch: {
    showMenu: function (val) {
      if (!val && this.$inputMode) {
        this.$inputMode.contextMenuInputMode.menuClosed();
      }
    },
  },
  methods: {
    register(graphComponent) {
      this.$graphComponent = graphComponent;
      let inputMode = graphComponent.inputMode;
      this.$inputMode = inputMode;
      this.addOpeningEventListeners(graphComponent, (location) => {
        const worldLocation = this.$graphComponent.toWorldFromPage(location);
        const showMenu = this.$inputMode.contextMenuInputMode.shouldOpenMenu(
          worldLocation
        );
        if (showMenu) {
          this.openMenu(location);
        }
      });

      inputMode.addPopulateItemContextMenuListener((sender, args) => {
        if (args.item) {
          if (
            !this.$graphComponent.selection.isSelected(args.item) &&
            this.$graphComponent.selection.selectedNodes.size > 0
          ) {
            // clear selection, first, if the item was not selected
            this.$graphComponent.selection.selectedNodes.clear();
          }
          return (
            args.item.tag && this.$emit("populate-context-menu", args.item.tag)
          );
        } else {
          return (
            args.item &&
            args.item.tag &&
            this.$emit("populate-context-menu", args.item.tag)
          );
        }
      });
      inputMode.contextMenuInputMode.addCloseMenuListener(() => this.hide());
    },
    hide() {
      this.showMenu = false;
    },
    openMenu(location) {
      this.showMenu = true;
      this.positionX = location.x;
      this.positionY = location.y;
    },
    addOpeningEventListeners(graphComponent, openingCallback) {
      const componentDiv = graphComponent.div;
      const contextMenuListener = (evt) => {
        evt.preventDefault();
        if (this.showMenu) {
          // might be open already because of the longpress listener
          return;
        }
        const me = evt;
        if (evt.mozInputSource === 1 && me.button === 0) {
          // This event was triggered by the context menu key in Firefox.
          // Thus, the coordinates of the event point to the lower left corner of the element and should be corrected.
          openingCallback(getCenterInPage(componentDiv));
        } else if (me.pageX === 0 && me.pageY === 0) {
          // Most likely, this event was triggered by the context menu key in IE.
          // Thus, the coordinates are meaningless and should be corrected.
          openingCallback(getCenterInPage(componentDiv));
        } else {
          openingCallback({ x: me.pageX, y: me.pageY });
        }
      };

      // Listen for the contextmenu event
      // Note: On Linux based systems (e.g. Ubuntu), the contextmenu event is fired on mouse down
      // which triggers the ContextMenuInputMode before the ClickInputMode. Therefore handling the
      // event, will prevent the ItemRightClicked event from firing.
      // For more information, see https://docs.yworks.com/yfileshtml/#/kb/article/780/
      componentDiv.addEventListener("contextmenu", contextMenuListener, false);

      if (detectSafariVersion() > 0 || detectiOSVersion() > 0) {
        // Additionally add a long press listener especially for iOS, since it does not fire the contextmenu event.
        let contextMenuTimer = null;
        graphComponent.addTouchDownListener((sender, args) => {
          contextMenuTimer = setTimeout(() => {
            openingCallback(
              graphComponent.toPageFromView(
                graphComponent.toViewCoordinates(args.location)
              )
            );
          }, 500);
        });
        graphComponent.addTouchUpListener(() => {
          clearTimeout(contextMenuTimer);
        });
      }

      // Listen to the context menu key to make it work in Chrome
      componentDiv.addEventListener("keyup", (evt) => {
        if (evt.keyCode === 93) {
          evt.preventDefault();
          openingCallback(getCenterInPage(componentDiv));
        }
      });
    },
  },
};
</script>

<style scoped></style>
