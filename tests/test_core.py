import ipaddress
import random
import unittest
from ipv4calc import calculate, validate_ip, validate_prefix
from ipv4calc.cli import valid_partial_ip, _read_controlled
from contextlib import redirect_stdout
from io import StringIO


class CalculationTests(unittest.TestCase):
    def compare(self, ip, prefix):
        result = calculate(ip, prefix)
        reference = ipaddress.IPv4Network(f"{ip}/{prefix}", strict=False)
        self.assertEqual(result.mask, str(reference.netmask))
        self.assertEqual(result.wildcard, str(reference.hostmask))
        self.assertEqual(result.network, str(reference.network_address))
        self.assertEqual(result.last_address, str(reference.broadcast_address))
        self.assertEqual(result.total, reference.num_addresses)
        self.assertEqual(result.hosts, reference.num_addresses if prefix >= 31 else reference.num_addresses - 2)
        self.assertEqual(result.first_host, str(next(iter(reference.hosts()))))
        self.assertEqual(result.last_host, str(reference.broadcast_address if prefix >= 31 else reference.broadcast_address - 1))
        self.assertEqual(result.broadcast, str(reference.broadcast_address) if prefix <= 30 else None)

    def test_every_prefix_and_boundaries(self):
        for prefix in range(33):
            for ip in ['0.0.0.0', '255.255.255.255', '192.168.10.130', '10.172.201.15', '128.0.0.0']:
                with self.subTest(ip=ip, prefix=prefix):
                    self.compare(ip, prefix)

    def test_random_networks(self):
        generator = random.Random(42)
        for _ in range(1000):
            self.compare(str(ipaddress.IPv4Address(generator.randrange(2 ** 32))), generator.randrange(33))

    def test_example(self):
        r = calculate('192.168.10.130', '/26')
        self.assertEqual((r.network, r.broadcast, r.first_host, r.last_host), ('192.168.10.128', '192.168.10.191', '192.168.10.129', '192.168.10.190'))
        self.assertEqual((r.block, r.block_octet, r.hosts), (64, 4, 62))

    def test_classification(self):
        self.assertEqual(calculate('192.168.1.0', 24).classification, 'Endereço de rede')
        self.assertEqual(calculate('192.168.1.255', 24).classification, 'Endereço de broadcast')
        self.assertEqual(calculate('192.168.1.1', 24).classification, 'Host utilizável')
        self.assertEqual(calculate('192.168.1.0', 31).classification, 'Host ponto a ponto')
        self.assertEqual(calculate('192.168.1.0', 32).classification, 'Endereço individual')

    def test_octet_boundary_blocks(self):
        for prefix, octet in [(0, 1), (8, 2), (16, 3), (24, 4)]:
            r = calculate('10.20.30.40', prefix)
            self.assertEqual((r.block, r.block_octet), (256, octet))
        self.assertEqual(calculate('1.2.3.4', 32).block_octet, None)


class ValidationTests(unittest.TestCase):
    def test_invalid_addresses(self):
        for ip in ['', ' ', '1.2.3', '1.2.3.4.5', '256.1.1.1', '-1.2.3.4', '1..3.4', '01.2.3.4', '000.0.0.0', '1.2.3.0000', '１.2.3.4', '1. 2.3.4', 'a.b.c.d', '1e2.2.3.4', '1.2.3.4/24', None, 1234]:
            with self.subTest(ip=ip), self.assertRaises(ValueError):
                validate_ip(ip)

    def test_invalid_prefixes(self):
        for prefix in ['', '/', '//24', '-1', '33', '1.5', '２４', 'a', None, True, 3.5, '000', '+24']:
            with self.subTest(prefix=prefix), self.assertRaises(ValueError):
                validate_prefix(prefix)

    def test_whitespace(self):
        self.assertEqual(validate_ip(' 1.2.3.4 '), '1.2.3.4')
        self.assertEqual(validate_prefix(' /24 '), 24)

    def test_controlled_input_states(self):
        for value in ['', '1', '192.', '192.168.0.', '0.0.0.0']:
            self.assertTrue(valid_partial_ip(value), value)
        for value in ['.', '1..', '256', '01', '192.168.1000', '1.2.3.4.', '1a']:
            self.assertFalse(valid_partial_ip(value), value)

    def test_keyboard_rejects_invalid_and_backspaces(self):
        keys = iter('192.168.10.1309a\b0\r')
        with redirect_stdout(StringIO()):
            self.assertEqual(_read_controlled(lambda: next(keys)), '192.168.10.130')


if __name__ == '__main__':
    unittest.main()
