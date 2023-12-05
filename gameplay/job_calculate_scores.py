# ===============================================================================
# Copyright 2023 ross
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============================================================================
from api_util import get_json
from scoring import calculate_asset_score, update_score, update_roster_score

import time


def main():
    # access_token = get_access_token()
    game = get_json("game")
    if not game:
        print("no active game")
        return
    print("game", game)
    game["slug"] = "game:0"
    data = get_json(f"players")
    print("starting scoring")
    st = time.time()
    for player in data:
        data = get_json(f'roster/{player["slug"]}.main')
        player_score = 0
        for asset in data:
            try:
                score = calculate_asset_score(asset)
            except Exception as e:
                print("Exception calculating score for", asset["slug"])
                continue

            update_score(asset["slug"], score, game["slug"])
            if asset["active"]:
                player_score += score or 0

        update_roster_score(game["slug"], f"{player['slug']}.main", player_score)

    et = time.time() - st
    print(f"scoring complete {et:0.3f}s")


if __name__ == "__main__":
    main()

# ============= EOF =============================================
