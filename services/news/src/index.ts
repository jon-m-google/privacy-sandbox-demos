/*
 Copyright 2022 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import express, {Application, Request, Response} from 'express';

import {
  AD_SERVER_HOST,
  EXTERNAL_PORT,
  HOME_HOST,
  LOREM,
  NEWS_DETAIL,
  NEWS_HOST,
  PORT,
  SSP_A_HOST,
  SSP_A_ORIGIN,
  SSP_B_HOST,
  SSP_B_ORIGIN,
  SSP_HOST,
} from './constants.js';

const app: Application = express();
app.use(express.static('src/public'));
app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req: Request, res: Response) => {
  res.render('index', {
    title: NEWS_DETAIL,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_A_HOST,
    SSP_B_HOST,
    AD_SERVER_HOST,
    SSP_TAG_URL: `https://${SSP_HOST}/js/ssp/ssp-tag.js`,
    AD_SERVER_LIB_URL: `https://${AD_SERVER_HOST}/js/ad-server-lib.js`,
    HEADER_BIDDING_LIB_URL: `https://${NEWS_HOST}/js/header-bidding-lib.js`,
    isMultiSeller: 'multi' === req.query.auctionType,
  });
});

app.get('/video-ad', async (req: Request, res: Response) => {
  res.render('video-ad', {
    title: NEWS_DETAIL,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_HOST,
  });
});

app.get('/single-seller', async (req: Request, res: Response) => {
  res.render('single-seller', {
    title: NEWS_DETAIL,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    AD_SERVER_LIB_URL: new URL(
      `https://${SSP_HOST}:${EXTERNAL_PORT}/js/ssp/ssp-tag.js`,
    ).toString(),
  });
});

app.get('/multi-seller', async (req: Request, res: Response) => {
  res.render('multi-seller', {
    title: NEWS_DETAIL,
    lorem: LOREM,
    EXTERNAL_PORT,
    HOME_HOST,
    SSP_A_ORIGIN,
    SSP_B_ORIGIN,
    AD_SERVER_LIB_URL: new URL(
      `https://${SSP_HOST}:${EXTERNAL_PORT}/js/ssp/ssp-tag.js`,
    ).toString(),
  });
});

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});
