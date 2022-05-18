# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import random
from faker import Faker
from util.tools import WeightedChoice
from util.tools import random_ipv4_from_region

faker = Faker()


def init_x_edge_location():
    rng = WeightedChoice(["ARN1-C1", "ARN53", "ATL52-C1", "BOS50-C2", "CDG3-C1", "CDG50-C1", "CDG53-C1", "CDG54",
                          "CPT50", "3-C1", "EWR53-C2", "FCO50-P1", "FRA53-C1", "FRA54", "GIG51-C1", "GRU1-C1",
                          "HAM50-C3", "HIO51-C1", "HKG50", "HKG51", "HKG53", "HYD50-C4", "IAD16", "IAD53",
                          "IAD79-C1", "IAD79-C2", "ICN50", "ICN54-C3", "JFK1", "JFK5", "JFK6", "KIX50-P2",
                          "LAX1", "LAX3-C1", "LAX50-C1", "LHR3-C1", "LHR4", "LHR50-C1", "LHR62-C1", "LHR62-C5",
                          "MAA3", "MAN50-C1", "MAN50-C2", "MIA3-C1", "MIA50", "MRS50", "MXP64-C3", "NRT12-C1",
                          "NRT20-C1", "NRT51-C1", "NRT52", "NRT53", "NRT57-C2", "ORD51-C1", "SEA19-C2", "SEA32",
                          "SEA4", "SFO5-P2", "SFO9"])
    return rng.run


def init_sc_bytes():
    """Return the size of the object returning by the client (%b)."""
    return lambda: int(random.gauss(55000, 8000))


def init_c_ip(ip_list):
    rng = WeightedChoice(ip_list)
    return rng.run


def init_cs_method():
    """Return the request method (%m)."""
    rng = WeightedChoice(["GET", "POST", "DELETE", "PUT"], [0.8, 0.1, 0.03, 0.07])
    return rng.run


def init_cs_host():
    rng = WeightedChoice(["d111111abcdef8.cloudfront.net",
                          "d3nnlo1goc4bi6.cloudfront.net",
                          "d13456asdfqef8.cloudfront.net",
                          "dcasdis99234ds.cloudfront.net",
                          "zxcvtyu678543d.cloudfront.net",
                          "dasdqwe3456sdf.cloudfront.net"])
    return rng.run


def init_cs_uri_stem():
    rng = WeightedChoice(["/Python-Release.png",
                          "/Javascript-Master.png",
                          "/Book-3.png",
                          "/Book-4.png",
                          "/Book-5.png",
                          "/Book-6.png",
                          "/Book-7.png",
                          "/Book-8.png",
                          "/Book-9.png",
                          "/Book-10.png"], [0.3, 0.25, 0.15, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04])
    return rng.run


def init_sc_status():
    """Return the HTTP status code (%s)."""
    rng = WeightedChoice(["200", "404", "500", "301"], [0.9, 0.04, 0.02, 0.04])
    return rng.run


def init_cs_referer():
    rng = WeightedChoice(["https://www.mydomain.com/page/Python-Release.png",
                          "https://www.mydomain.com/page/Javascript-Master.png",
                          "https://www.mydomain.com/page/Book-3.png",
                          "https://www.mydomain.com/page/Book-4.png",
                          "https://www.mydomain.com/page/Book-5.png",
                          "https://www.mydomain.com/page/Book-6.png",
                          "https://www.mydomain.com/page/Book-7.png",
                          "https://www.mydomain.com/page/Book-8.png",
                          "https://www.mydomain.com/page/Book-9.png",
                          "https://www.mydomain.com/page/Book-10.png"],
                         [0.3, 0.25, 0.15, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04])
    return rng.run


def init_cs_user_agent():
    user_agent = [faker.chrome(), faker.firefox(), faker.safari(), faker.internet_explorer(), faker.opera()]
    rng = WeightedChoice(user_agent, [0.5, 0.3, 0.1, 0.05, 0.05])
    return rng.run


def init_cs_uri_query():
    return lambda: "-"


def init_cs_cookie():
    return lambda: "-"


def init_x_edge_result_type():
    rng = WeightedChoice(["Hit", "RefreshHit", "Miss", "LimitExceeded", "CapacityExceeded ", "Error", "Redirect"],
                         [0.7, 0.05, 0.15, 0.01, 0.01, 0.01, 0.07])
    return rng.run


def init_x_edge_request_id():
    return lambda: generate_random_str(56)


def init_x_host_header():
    rng = WeightedChoice(["d111111abcdef8.cloudfront.net",
                          "d3nnlo1goc4bi6.cloudfront.net",
                          "d13456asdfqef8.cloudfront.net",
                          "dcasdis99234ds.cloudfront.net",
                          "zxcvtyu678543d.cloudfront.net",
                          "dasdqwe3456sdf.cloudfront.net"])
    return rng.run


def init_cs_protocol():
    rng = WeightedChoice(["https", "http", "ws", "wss"],
                         [0.6, 0.2, 0.1, 0.1])
    return rng.run


def init_cs_bytes():
    return lambda: float(random.gauss(1520.000, 40))


def init_time_taken():
    return lambda: float(random.gauss(1.4, 0.3))


def init_x_forwarded_for():
    return lambda: "-"


def init_ssl_protocol():
    rng = WeightedChoice(["TLSv1.3", "TLSv1.2", "TLSv1.1", "TLSv1"],
                         [0.6, 0.2, 0.1, 0.1])
    return rng.run


def init_ssl_cipher():
    rng = WeightedChoice(["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
                         [0.6, 0.2, 0.2])
    return rng.run


def init_x_edge_response_result_type():
    rng = WeightedChoice(["Hit", "RefreshHit", "Miss", "LimitExceeded", "CapacityExceeded ", "Error", "Redirect"],
                         [0.7, 0.05, 0.15, 0.01, 0.01, 0.01, 0.07])
    return rng.run


def init_cs_protocol_version():
    rng = WeightedChoice(["HTTP/2.0", "HTTP/1.1", "HTTP/1.0", "HTTP/0.9"],
                         [0.6, 0.2, 0.1, 0.1])
    return rng.run


def init_fle_status():
    return lambda: "-"


def init_fle_encrypted_fields():
    return lambda: "-"


def init_c_port():
    return lambda: random.randint(1000, 16000)


def init_time_to_first_byte():
    return lambda: float(random.gauss(1.2, 0.3))


def init_x_edge_detailed_result_type():
    rng = WeightedChoice(["Miss", "AbortedOrigin", "ClientCommError", "ClientGeoBlocked"],
                         [0.9, 0.05, 0.03, 0.02])
    return rng.run


def init_sc_content_type():
    return lambda: "image/png"


def init_sc_content_len():
    return lambda: float(random.gauss(620752, 50000))


def init_sc_range_start():
    return lambda: "-"


def init_sc_range_end():
    return lambda: "-"


def generate_random_str(length):
    random_str = ""
    base_str = "ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789"
    n = len(base_str) - 1
    for i in range(length):
        random_str += base_str[random.randint(0, n)]
    return random_str
