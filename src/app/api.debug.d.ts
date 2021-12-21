export declare type GdbDict = {
  [key: string]: GdbVal;
};
export declare type GdbArray = GdbVal[];
export declare type GdbVal = GdbArray | GdbDict | string;
export interface GdbResponse {
  type: "notify" | "result" | "console" | "log" | "target" | "done" | "output";
  message: string | null;
  payload: GdbVal | null;
  token?: number | null;
}
