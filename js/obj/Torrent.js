/*!
  Copyright (C) 2014 Tolga HOŞGÖR

  This file is part of chorrent.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function Torrent(torrentData, peerId)
{
  var self = this;

  this.metadata = torrentData;
  this.structuredPaths = new Array;
  this.peerId = new Int8Array(20);
  this.httpTrackers = new Array;
  this.udpTrackers = new Array;
  this.peers = new Array;
  this.seeders = new Int32Array(1);
  this.leechers = new Int32Array(1);

  /* generate random peer id for this torrent if none given */
  if(peerId === undefined)
  {
    for(var i = 0; i < 20; ++i)
    {
      this.peerId[i] = Math.floor(Math.random() * 256);
    };
  }
  else
    this.peerId = peerId;

  /* store trackers seperately according to protocol */
  var protocolRegex = [/^http(s):\/\//, /^udp:\/\/(.+?)(?::([\d]+))?\//];

  var match;
  if(this.metadata["announce-list"] !== undefined)
  {
    this.metadata["announce-list"].forEach(function(tracker) {
      if(tracker[0].match(protocolRegex[0]))
        self.httpTrackers.push(tracker[0]);
      else if((match = tracker[0].match(protocolRegex[1])))
        self.udpTrackers.push({hostname: match[1], port: parseInt(match[2])});
    });
  } else
  {
    /* here because always the same with one in announce-list? */
    if(this.metadata.announce.match(protocolRegex[0]))
      this.httpTrackers.push(this.metadata.announce);
    else if((match = this.metadata.announce.match(protocolRegex[1])))
      this.udpTrackers.push({hostname: match[1], port: parseInt(match[2])});
  }

  /* if torrent has multiple files */
  if(this.metadata.info.files)
  {
    this.metadata.info.files.forEach(function(e) {
      e.path.forEach(function(e2, index, array) {
        //TODO: find a js tree checkbox lib and generate compatible structure
      });
    });
  }

  /* get sha1 of bencoded torrent metadata info */
  var sha1 = new Rusha(this.metadata.info.length);
  var infoHashStr = sha1.digest(Bencode.encode(this.metadata.info));
  this.infoHash = new Int8Array(Utility.hexStr2ab(infoHashStr));

  /* percent encode the hex string of sha1 */
  this.peInfoHash = new String;
  for(var i = 0; i < 40; i += 2)
  {
    this.peInfoHash = this.peInfoHash + "%" + infoHashStr.substr(i, 2);
  }

  this.updatePeers();
}

Torrent.prototype.updatePeers = function()
{
  var self = this;

  this.httpTrackers.forEach(function(tracker) {
    var requestUri = tracker + "?info_hash=" + this.peInfoHash + "&peer_id="
      + this.peerId + "&port=6881&uploaded=0&downloaded=0&left=" + this.size();
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4)
      {
        var correctedResponse = xhr.responseText.toString();
        var regexList = [/5:peers/, /([^d])2\:ip/g, /porti([\d]{2,5})[^e](.+?):/g];
        var replacementList = ["5:peersl", "$1d2:ip", "porti$1e$2:"];
        for(var i = 0; i < regexList.length; ++i)
        {
          correctedResponse = correctedResponse.replace(regexList[i], replacementList[i]);
        }
        correctedResponse = correctedResponse.replace(/( )?$/, "e$1");

        self.peers = Bencode.decode(correctedResponse);

        self.onPeersChanged();
      }
    };
    xhr.open("GET", requestUri, true);
    xhr.send();
  });

  this.udpTrackers.forEach(function(tracker) {
    var udpTracker = new UdpTracker(tracker, self);
  });
}

Torrent.prototype.onPeersChanged = function()
{
}

Torrent.prototype.size = function()
{
  return (this.metadata.info.pieces.length * this.metadata.info["piece length"] / 20);
}

Torrent.prototype.start = function()
{
}

Torrent.prototype.stop = function()
{
}

Torrent.prototype.status = function()
{
}

Torrent.prototype.completionPercentage = function()
{
}