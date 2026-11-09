import Feature, { type FeatureLike } from "ol/Feature";
import type OLMap from "ol/Map";
import { createEmpty, extend, getHeight, getWidth } from "ol/extent";
import Cluster from "ol/source/Cluster";
import { VIEW_ANIMATION_DURATION, easeOutCubic } from "../animation";
import type { VectorBaseLayer } from "../types";

// Space between clustered points before they're drawn apart, in pixels
export const DEFAULT_CLUSTER_DISTANCE = 40;

// Past this zoom, points still drawn as one cluster are treated as being in
// the same place, so clicking the cluster opens them all instead of zooming
const MAX_CLUSTER_ZOOM = 18;

// The features a cluster stands for; undefined for any other feature
export const clusterMembers = (
  feature: FeatureLike,
): FeatureLike[] | undefined => {
  const members: unknown = feature.get("features");
  return Array.isArray(members) && members[0] instanceof Feature
    ? (members as FeatureLike[])
    : undefined;
};

// Whether `feature` stands for several features. OpenLayers also wraps points
// that aren't near any others, which are drawn and treated as plain points.
export const isCluster = (feature: FeatureLike) =>
  (clusterMembers(feature)?.length ?? 0) > 1;

// The point a cluster of one stands for; anything else as is
export const unwrapCluster = (feature: FeatureLike) => {
  const members = clusterMembers(feature);
  return members?.length === 1 ? members[0] : feature;
};

// Animates the view to spread out a cluster's points. Returns false, leaving
// the view alone, for anything that isn't a cluster and for one whose points
// are too close to ever be drawn apart.
export const zoomToCluster = (
  map: OLMap,
  layer: VectorBaseLayer,
  feature: FeatureLike,
  getPadding: () => number[], // top, right, bottom, left, in pixels
): boolean => {
  const source = layer.getSource();
  if (!(source instanceof Cluster) || !isCluster(feature)) return false;

  const extent = createEmpty();
  clusterMembers(feature)?.forEach((member) => {
    const memberExtent = member.getGeometry()?.getExtent();
    if (memberExtent) extend(extent, memberExtent);
  });

  const view = map.getView();
  const closest = view.getResolutionForZoom(MAX_CLUSTER_ZOOM);
  const spread = Math.max(getWidth(extent), getHeight(extent)) / closest;
  if (spread <= source.getDistance()) return false;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  view.fit(extent, {
    padding: getPadding(),
    maxZoom: MAX_CLUSTER_ZOOM,
    duration: reduceMotion ? 0 : VIEW_ANIMATION_DURATION,
    easing: easeOutCubic,
  });
  return true;
};
