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

// SSP
import express from 'express';

const {
  EXTERNAL_PORT,
  PORT,
  SSP_B_HOST,
  SSP_B_DETAIL,
  SSP_B_TOKEN,
  DSP_A_HOST,
  DSP_A_URI,
  DSP_B_HOST,
  DSP_B_URI,
  SHOP_HOST,
  NEWS_HOST,
} = process.env;

const DSP_A = new URL(`https://${DSP_A_HOST}:${EXTERNAL_PORT}`);
const DSP_B = new URL(`https://${DSP_B_HOST}:${EXTERNAL_PORT}`);
const SSP_B = new URL(`https://${SSP_B_HOST}:${EXTERNAL_PORT}`);

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Origin-Trial', SSP_B_TOKEN);
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  // opt-in fencedframe
  if (req.get('sec-fetch-dest') === 'fencedframe') {
    res.setHeader('Supports-Loading-Mode', 'fenced-frame');
  }
  next();
});

app.use(
  express.static('src/public', {
    setHeaders: (res, path) => {
      const shouldAddAuctionHeader = [
        'decision-logic.js',
        'trusted.json',
        'direct.json',
      ].some((fileName) => path.includes(fileName));

      if (shouldAddAuctionHeader) {
        return res.set('Ad-Auction-Allowed', 'true');
      }

      if (path.endsWith('/run-ad-auction.js')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
        res.set('Permissions-Policy', 'run-ad-auction=(*)');
      }
    },
  }),
);

app.set('view engine', 'ejs');
app.set('views', 'src/views');

app.get('/', async (req, res) => {
  const title = SSP_B_DETAIL;
  res.render('index.html.ejs', {
    title,
    DSP_B_HOST,
    SSP_B_HOST,
    EXTERNAL_PORT,
    SHOP_HOST,
  });
});

app.get('/ad-tag.html', async (req, res) => {
  res.render('ad-tag.html.ejs');
});

app.get('/video-ad-tag.html', async (req, res) => {
  res.render('video-ad-tag.html.ejs');
});

async function fetchHeaderBids() {
  return Promise.all(
    [`${DSP_A_URI}/header-bid`, `${DSP_B_URI}/header-bid`].map(
      async (dspUrl) => {
        const response = await fetch(dspUrl);
        const result = await response.json();
        return result;
      },
    ),
  );
}

async function getHeaderBiddingAd() {
  const headerBids = await fetchHeaderBids();
  const [highestBid] = headerBids.sort((a, b) => b.bid - a.bid);
  return highestBid;
}

function getComponentAuctionConfig() {
  return {
    seller: SSP_B,
    decisionLogicUrl: `${SSP_B}js/decision-logic.js`,
    trustedScoringSignalsURL: `${SSP_B}signals/trusted.json`,
    directFromSellerSignals: `${SSP_B}signals/direct.json`,
    interestGroupBuyers: [DSP_A, DSP_B],
    perBuyerSignals: {
      [DSP_A]: {'some-key': 'some-value'},
      [DSP_B]: {'some-key': 'some-value'},
    },
    deprecatedReplaceInURN: {
      '%%SSP_VAST_URI%%': `${SSP_B}/vast/preroll`,
    },
  };
}

app.get('/header-bid', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', `https://${NEWS_HOST}`);

  res.json({
    seller: SSP_B,
    headerBiddingAd: await getHeaderBiddingAd(),
    componentAuctionConfig: getComponentAuctionConfig(),
  });
});

async function getAdServerAd() {
  const adServerBids = await Promise.all(
    [`${DSP_A_URI}/ad-server-bid`, `${DSP_B_URI}/ad-server-bid`].map(
      async (dspUrl) => {
        const response = await fetch(dspUrl);
        const result = await response.json();
        return result;
      },
    ),
  );

  const [highestBid] = adServerBids.sort((a, b) => b.bid - a.bid);
  return highestBid;
}

app.get('/ad-server-bid', async (req, res) => {
  res.json({
    seller: SSP_B,
    adServerAd: await getAdServerAd(),
  });
});

app.get('/reporting', (req, res) => {
  res.send(200);
});

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
