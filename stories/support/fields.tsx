import { Fragment } from "react";
import { DataList, Separator } from "@radix-ui/themes";
import type { FeatureProps, Render } from "../../src";

// [property, label] pairs to show
export type Fields = [key: string, label: string][];

// Tooltip and details content, as folklorico's maps page renders a layer's
// fields: a list per feature, with a rule between features on the same spot
export const renderFields =
  (fields: Fields): Render =>
  (features: FeatureProps[]) =>
    features.map((f, i) => (
      <Fragment key={i}>
        {i > 0 && <Separator size="4" my="2" />}
        <DataList.Root size="1">
          {fields.map(([key, label]) => (
            <DataList.Item key={key}>
              <DataList.Label minWidth="88px">{label}</DataList.Label>
              <DataList.Value>
                {f[key] == null ? "—" : String(f[key])}
              </DataList.Value>
            </DataList.Item>
          ))}
        </DataList.Root>
      </Fragment>
    ));
