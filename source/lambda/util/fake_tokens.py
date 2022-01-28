import datetime
import random
from faker import Faker
from tzlocal import get_localzone
from util.tools import WeightedChoice
import util.cloudfront_faker as cloudfront_faker


class FakeTokens:
    """List of methods to generate fake tokens."""

    def __init__(self, faker=None, date=None, date_pattern="%d/%b/%Y:%H:%M:%S", sleep=None):
        self.faker = Faker() if faker is None else faker
        self.otime = datetime.datetime.now() if date is None else date
        self.dispatcher = {}
        self.date_pattern = date_pattern
        self.sleep = sleep

        # Nginx & Apache Log
        self.register_token("b", self.init_size_object())
        self.register_token("d", self.init_date())
        self.register_token("h", self.init_host())
        self.register_token("m", self.init_method())
        self.register_token("s", self.init_status_code())
        self.register_token("u", self.init_user_agent())
        self.register_token("v", self.init_server_name())
        self.register_token("H", self.init_protocol())
        self.register_token("R", self.init_referrer())
        self.register_token("U", self.init_url_request())
        self.register_token("Z", self.init_timezone())

        # CloudFront Log
        self.register_token("timestamp", self.init_date())
        self.register_token("x-edge-location", cloudfront_faker.init_x_edge_location())
        self.register_token("sc-bytes", cloudfront_faker.init_sc_bytes())
        self.register_token("c-ip", cloudfront_faker.init_c_ip())
        self.register_token("cs-method", cloudfront_faker.init_cs_method())
        self.register_token("cs-host", cloudfront_faker.init_cs_host())
        self.register_token("cs-uri-stem", cloudfront_faker.init_cs_uri_stem())
        self.register_token("sc-status", cloudfront_faker.init_sc_status())
        self.register_token("cs-referer", cloudfront_faker.init_cs_referer())
        self.register_token("cs-user-agent", cloudfront_faker.init_cs_user_agent())
        self.register_token("cs-uri-query", cloudfront_faker.init_cs_uri_query())
        self.register_token("cs-cookie", cloudfront_faker.init_cs_cookie())
        self.register_token("x-edge-result-type", cloudfront_faker.init_x_edge_result_type())
        self.register_token("x-edge-request-id", cloudfront_faker.init_x_edge_request_id())
        self.register_token("x-host-header", cloudfront_faker.init_x_host_header())
        self.register_token("cs-protocol", cloudfront_faker.init_cs_protocol())
        self.register_token("cs-bytes", cloudfront_faker.init_cs_bytes())
        self.register_token("time-taken", cloudfront_faker.init_time_taken())
        self.register_token("x-forwarded-for", cloudfront_faker.init_x_forwarded_for())
        self.register_token("ssl-protocol", cloudfront_faker.init_ssl_protocol())
        self.register_token("ssl-cipher", cloudfront_faker.init_ssl_cipher())
        self.register_token("x-edge-response-result-type", cloudfront_faker.init_x_edge_response_result_type())
        self.register_token("cs-protocol-version", cloudfront_faker.init_cs_protocol_version())
        self.register_token("fle-status", cloudfront_faker.init_fle_status())
        self.register_token("fle-encrypted-fields", cloudfront_faker.init_fle_encrypted_fields())
        self.register_token("c-port", cloudfront_faker.init_c_port())
        self.register_token("time-to-first-byte", cloudfront_faker.init_time_to_first_byte())
        self.register_token("x-edge-detailed-result-type", cloudfront_faker.init_x_edge_detailed_result_type())
        self.register_token("sc-content-type", cloudfront_faker.init_sc_content_type())
        self.register_token("sc-content-len", cloudfront_faker.init_sc_content_len())
        self.register_token("sc-range-start", cloudfront_faker.init_sc_range_start())
        self.register_token("sc-range-end", cloudfront_faker.init_sc_range_end())

    def register_token(self, key, method):
        self.dispatcher.update({key: method})

    def get_tokens(self, date_pattern=None):
        if date_pattern is not None:
            self.date_pattern = date_pattern
        return self.dispatcher

    def run_token(self, token):
        return self.dispatcher[token]()

    def inc_date(self):
        sleep = self.sleep if self.sleep is not None else random.randint(-2, 0)
        increment = datetime.timedelta(seconds=sleep)
        self.otime += increment
        return self.otime

    # ----------------------------------------------
    def init_location(self):
        rng = WeightedChoice(["HKG62-C2", "HKG62-C3", "HKG62-C4", "HKG62-C5"], [0.8, 0.1, 0.05, 0.05])
        return rng.run

    def init_date(self):
        """Return the date (%d)."""

        def get_date():
            date = self.inc_date()
            return date.strftime(self.date_pattern)

        return get_date

    def init_host(self):
        """Return the client IP address (%h)."""
        return self.faker.ipv4

    def init_method(self):
        """Return the request method (%m)."""
        rng = WeightedChoice(["GET", "POST", "DELETE", "PUT"], [0.8, 0.1, 0.05, 0.05])
        return rng.run

    def init_protocol(self):
        """Return the request protocol (%H)."""
        return lambda: "HTTP/1.0"

    def init_referrer(self):
        """Return the referrer HTTP request header (%R)."""
        return self.faker.uri

    def init_server_name(self, servers=None):
        """Return the server name (%v)."""
        if servers is None:
            servers = ["example1", "example2"]
        return lambda: random.choice(servers)

    def init_size_object(self):
        """Return the size of the object returning by the client (%b)."""
        return lambda: int(random.gauss(5000, 50))

    def init_status_code(self):
        """Return the HTTP status code (%s)."""
        rng = WeightedChoice(["200", "404", "500", "301"], [0.9, 0.04, 0.02, 0.04])
        return rng.run

    def init_timezone(self):
        """Return the timezone (%Z)."""
        timezone = datetime.datetime.now(get_localzone()).strftime("%z")
        return lambda: timezone

    def init_url_request(self, list_files=None):
        """Return the URL path requested (%U)."""
        if list_files is None:
            list_files = []
            for _ in range(0, 10):
                list_files.append(self.faker.file_path(depth=random.randint(0, 2), category="text"))

        return lambda: random.choice(list_files)

    def init_user_agent(self):
        """Return the user-agent HTTP request header (%u)."""
        user_agent = [self.faker.chrome(), self.faker.firefox(), self.faker.safari(), self.faker.internet_explorer(),
                      self.faker.opera()]
        rng = WeightedChoice(user_agent, [0.5, 0.3, 0.1, 0.05, 0.05])
        return rng.run
