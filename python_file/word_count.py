import os
import time
import sys

import pymongo
from pymongo import MongoClient

# from konlpy.tag import Okt
from konlpy.tag import Mecab
from collections import Counter

import pandas as pd
import numpy as np
import csv
import json

import logging
import threading
import multiprocessing

# multi-threading class
class token_thread(threading.Thread):
    def __init__(self, name, df):
        threading.Thread.__init__(self)
        self.name = name
        self.df = df

    def run(self):
        # logging.info("[Sub-Thread] %s: 시작합니다.", self.name)

        sentences_tag = []
        for sentence in self.df:
            morph = mecab.pos(sentence)
            for word, tag in morph:
                if tag in mecab_noun_list:
                    noun_list.append(word)

        # logging.info("[Sub-Thread] %s: 종료합니다.", self.name)

# mongo 연결
# arguments
# collection_name = "A오딘발할라라이징"
# start_date = "2021-01-01"
# end_date = "2022-03-11"

collection_name = sys.argv[1]
start_date = sys.argv[2]
end_date = sys.argv[3]

with open('/data/front/config/mongo.json') as f:
    mongo_config = json.load(f)
    f.close()

client = MongoClient(mongo_config["host"])
db = client["review"]
db_col = db[collection_name]

# 기간 필터 걸어서 원하는 document 불러온 후 df 생성
df_review = pd.DataFrame(list(db_col.find({'DATE': {'$gte': start_date, '$lte': end_date}}).sort('DATE', -1)))

client.close()

df_comment = df_review["COMMENT"]

mecab_noun_list = ["NNG", "NNP", "NP"]
noun_list = []
mecab = Mecab()

start = time.time()
n_cores = 6
df_split = np.array_split(df_comment,n_cores)

a = token_thread('1', df_split[0])
b = token_thread('2', df_split[1])
c = token_thread('3', df_split[2])
d = token_thread('4', df_split[3])
e = token_thread('5', df_split[4])
f = token_thread('6', df_split[5])

# logging.info("[Main-Thread] 쓰레드 시작 전")

a.start()
b.start()
c.start()
d.start()
e.start()
f.start()

a.join()  # 서브 조인 시작
b.join()
c.join()
d.join()
e.join()
f.join()

# logging.info("[Main-Thread] 프로그램을 종료합니다.")

counts = Counter(noun_list)
# print(counts.most_common(30))
for key, val in counts.most_common(5):
    print(key)
# print(counts.most_common(5))
