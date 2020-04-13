import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { TEAMS } from 'game/utils/enums';

export default class LobbyIndexController extends Controller {
  @service socket;
  @service user;

  @tracked isEditMode = false;

  TEAMS = TEAMS;

  get playersList() {
    return Object.values(this.socket.players);
  }

  get leadTeamA() {
    return this.playersList.find(
      (player) => player.team === TEAMS.TEAM_A && player.lead
    );
  }

  get leadTeamB() {
    return this.playersList.find(
      (player) => player.team === TEAMS.TEAM_B && player.lead
    );
  }

  get playersTeamA() {
    return this.playersList.filter(
      (player) => player.team === TEAMS.TEAM_A && !player.lead
    );
  }

  get playersTeamB() {
    return this.playersList.filter(
      (player) => player.team === TEAMS.TEAM_B && !player.lead
    );
  }

  get playersWaiting() {
    return this.playersList.filter((player) => player.team === undefined);
  }

  get canContinue() {
    return (
      this.playersWaiting.length === 0 &&
      this.playersTeamA.length > 0 &&
      this.playersTeamB.length > 0 &&
      !!this.leadTeamA &&
      !!this.leadTeamB
    );
  }

  @action
  async updateUser(user, newData, persist) {
    let target = newData;
    const players = this.socket.players;

    if (persist && user.id === this.user.data.id) {
      this.user.data = {
        ...this.user.data,
        ...newData,
      };

      target = this.user.data;
    }

    Object.keys(target).forEach((key) => {
      set(players[user.id], key, target[key]);
    });

    await this.socket.syncPlayers(players);
  }

  @action
  async setTeam(player, team) {
    const players = {
      ...this.socket.players,
      [player.id]: {
        ...player,
        team,
      },
    };

    await this.socket.syncPlayers(players);
  }

  @action
  async toggleLead(player) {
    const players = {
      ...this.socket.players,
      [player.id]: {
        ...player,
        lead: !player.lead,
      },
    };

    await this.socket.syncPlayers(players);
  }

  @action
  async startGame() {
    // TODO Seal game

    this.transitionToRoute('lobby.game');
  }
}
