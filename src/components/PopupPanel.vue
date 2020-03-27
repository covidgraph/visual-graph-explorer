<template>
  <v-menu
    v-model="visible"
    ref="div"
    :absolute="true"
    :position-x="leftOffset"
    :position-y="topOffset"
    :close-on-click="false"
    :close-on-content-click="false"
  >
    <slot></slot>
  </v-menu>
</template>

<script>
import { IEdge, Point, SimpleLabel, Size } from "yfiles";

export default {
  name: "PopupPanel",
  data: () => ({
    model: null,
    dirty: true,
    visible: false,
    leftOffset: 0,
    topOffset: 0,
  }),
  methods: {
    register(graphComponent, labelModelParameter) {
      this.labelModelParameter = labelModelParameter;
      this.div = this.$refs.div;
      this.graphComponent = graphComponent;
      // Add listeners for node layout changes
      this.graphComponent.graph.addNodeLayoutChangedListener(
        (node, oldLayout) => {
          if (
            ((this.model && this.model === node) ||
              IEdge.isInstance(this.model)) &&
            (node === this.model.sourcePort.owner ||
              node === this.model.targetPort.owner)
          ) {
            this.dirty = true;
          }
        }
      );

      this.graphComponent.addViewportChangedListener(
        (sender, propertyChangedEventArgs) => {
          if (this.model) {
            this.dirty = true;
          }
        }
      );

      // Add listener for updates of the visual tree
      this.graphComponent.addUpdatedVisualListener((sender, eventArgs) => {
        if (this.model && this.dirty) {
          this.dirty = false;
          this.updateLocation();
        }
      });
    },
    /**
     * Changes the location of this pop-up to the location calculated by the
     * {@link HTMLPopupSupport#labelModelParameter}. Currently, this implementation does not support rotated pop-ups.
     */
    updateLocation() {
      if (
        !this.div ||
        !this.div.$el ||
        !this.model ||
        !this.labelModelParameter
      ) {
        return;
      }
      const width = this.div.$el.clientWidth;
      const height = this.div.$el.clientHeight;
      const zoom = this.graphComponent.zoom;

      // create a dummy label to let the LabelModelParameter compute the correct location
      const dummyLabel = new SimpleLabel(
        this.model,
        "",
        this.labelModelParameter
      );
      if (this.labelModelParameter.supports(dummyLabel)) {
        dummyLabel.preferredSize = new Size(width / zoom, height / zoom);
        const newLayout = this.labelModelParameter.model.getGeometry(
          dummyLabel,
          this.labelModelParameter
        );
        this.setLocation(newLayout.anchorX, newLayout.anchorY - height / zoom);
      }
    },

    /**
     * Sets the location of this pop-up to the given world coordinates.
     * @param {number} x The target x-coordinate of the pop-up.
     * @param {number} y The target y-coordinate of the pop-up.
     */
    setLocation(x, y) {
      // Calculate the view coordinates since we have to place the div in the regular HTML coordinate space
      const viewPoint = this.graphComponent.toPageFromView(
        this.graphComponent.toViewCoordinates(new Point(x, y))
      );
      this.leftOffset = viewPoint.x;
      this.topOffset = viewPoint.y;
    },
    showPopup(item) {
      this.model = item;
      this.updateLocation();
      this.visible = true;
    },
    hide() {
      this.visible = false;
    },
  },
};
</script>

<style scoped></style>
