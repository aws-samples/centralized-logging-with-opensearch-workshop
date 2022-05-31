import logging
import os
import random
import ipaddress
import util.faker_config as config

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class WeightedChoice:
    """Weighted version of random.choice."""

    def __init__(self, values, weights=None):
        if weights is None:
            weights = [1] * len(values)

        self.choices = [[x, y] for x, y in zip(values, weights)]
        self.total = sum(w for c, w in self.choices)

    def run(self):
        """Get a random value."""
        rnd = random.uniform(0, self.total)
        upto = 0
        for choice, weight in self.choices:
            if upto + weight >= rnd:
                return choice
            upto += weight
        assert False, "Shouldn't get here."
        return None


def upload_folder_to_s3(s3_bucket, input_dir, s3_path):
    """
    Upload a folder to s3, and keep the folder structure
    :param s3_bucket:
    :param input_dir:
    :param s3_path:
    :return:
    """
    logger.info("Uploading results to s3 initiated...")

    try:
        for path, subdirs, files in os.walk(input_dir):
            for file in files:
                dest_path = path.replace(input_dir, "")
                __s3file = os.path.normpath(s3_path + '/' + dest_path + '/' + file)
                __local_file = os.path.join(path, file)
                logger.info("Upload : %s  to Target: %s" % (__local_file, __s3file))
                s3_bucket.upload_file(__local_file, __s3file)
    except Exception as e:
        logger.error(" ... Failed!! Quitting Upload!!")
        logger.error(e)
        raise e


def random_ipv4_from_region(region_name):
    ip_map = config.region_ip_map
    try:
        cidr = ip_map[region_name]
    except:
        print("region name is not in the region_ip_map! Using default region.")
        cidr = '54.242.0.0/15'
    return random.choice([str(ip) for ip in ipaddress.IPv4Network(cidr)])