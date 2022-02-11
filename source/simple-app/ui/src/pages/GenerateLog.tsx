import React, { useEffect, useState } from "react";
import { Navigation } from "./common/Nav";
import axios from "axios";
import Axios from "../js/request";
import { Card, Button } from "@blueprintjs/core";
import Swal from "sweetalert2";

const GenerateLog = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [fakerAPIUrl, setFakerAPIUrl] = useState("/");
  const generateLog = (type: string) => {
    console.info("fakerAPIUrl:", fakerAPIUrl);
    setLoadingGen(true);
    axios
      .post(fakerAPIUrl + type)
      .then((res) => {
        console.info("res:", res);
        setLoadingGen(false);
        if (res.data === "Success") {
          Swal.fire({
            icon: "success",
            text: "Generate " + type + " Logs Successfully.",
            confirmButtonColor: "#3085d6",
          });
        } else {
          Swal.fire({
            icon: "error",
            text: JSON.stringify(res.data),
            confirmButtonColor: "#3085d6",
          });
        }
      })
      .catch((err) => {
        setLoadingGen(false);
        console.error(err);
      });
  };

  const getAPIConfig = () => {
    setLoadingData(true);
    Axios.get("/config.json?timeStamp=" + new Date().getTime()).then((res) => {
      setLoadingData(false);
      console.info("res.data:", res.data);
      if (res.data) {
        setFakerAPIUrl(res.data.fakerAPIUrl);
      }
    });
  };

  useEffect(() => {
    getAPIConfig();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="create-box">
        {loadingData ? (
          <div
            style={{ color: "#eee" }}
            className="mt-20 padding-10 text-center"
          >
            Loading...
          </div>
        ) : (
          <Card className="mt-20 example-card bp3-dark">
            <div className="example-header text-center">
              <b>Generate Logs</b>
            </div>
            <div className="mt-10 padding-10">
              <div className="mt-20 text-center">
                <Button
                  loading={loadingGen}
                  disabled={loadingGen}
                  style={{ width: "100%" }}
                  type="button"
                  className="bp3-button bp3-intent-primary bp3-round modifier"
                  onClick={() => {
                    generateLog("cloudfront");
                  }}
                >
                  Generate CloudFront Logs
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GenerateLog;
