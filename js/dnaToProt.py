#!/usr/bin/env python

from Bio.Seq import Seq
from Bio.Alphabet import IUPAC
import sys

def dnaToProt(dna_seq):
    coding_seq = Seq(dna_seq, IUPAC.unambiguous_dna)
    print coding_seq.translate()

def main(argv):
    dnaToProt(sys.argv[1])

if __name__ == "__main__":
    main(sys.argv[1])