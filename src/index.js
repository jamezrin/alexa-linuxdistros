const Alexa = require('ask-sdk-core');
const path = require('path');
const fs = require('fs');

const distroPath = path.resolve(__dirname, 'ranking.json');
const distroRanking = JSON.parse(fs.readFileSync(distroPath));

const SKILL_TITLE = "Distribuciones de Linux";

function getSlotValueId(intentSlot) {
  const resolutions = intentSlot.resolutions.resolutionsPerAuthority;
  for (const resolution of resolutions) {
    if (resolution.status.code === "ER_SUCCESS_MATCH") {
      const firstIntentSlotValue = resolution.values[0].value;
      return firstIntentSlotValue.id;
    }
  }
}

function getRankingByPeriod(periodSlot) {
  const periodSlotValue = periodSlot.value;

  if (!periodSlotValue) {
    return distroRanking[0];
  }

  const periodSlotValueId = getSlotValueId(periodSlot);
  if (periodSlotValueId === "last_month") {
    return distroRanking[0];
  } else if (periodSlotValueId === "last_tree_months") {
    return distroRanking[1];
  } else if (periodSlotValueId === "last_six_months") {
    return distroRanking[2];
  } else if (periodSlotValueId === "last_twelve_months") {
    return distroRanking[3];
  }
}

const DistroRankingIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "DistroRankingIntent"
  },

  async handle(handlerInput) {
    const intent = handlerInput.requestEnvelope.request.intent;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    const periodSlot = intent.slots["period"];

    const distroRanking = getRankingByPeriod(periodSlot);

    sessionAttributes.rankingPage = 1;
    sessionAttributes.rankingSlot = periodSlot;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    var distroListText = '';
    for (var i = 0; i < 10; i++) {
      const distro = distroRanking.distros[i];

      if (i > 0) {
        distroListText += ' ';
      }

      distroListText += `La <say-as interpret-as="cardinal">${distro.position}</say-as> distro es <lang xml:lang="en-US">${distro.name}</lang> con ${distro.hits} votos.`;
    }

    const speechText = `Las primeras diez distribuciones en el ranking son ${distroListText}. ¿Quieres saber las siguientes diez?`
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .getResponse();
  }
}

const DistroRankingNextIntentHandler = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && (handlerInput.requestEnvelope.request.intent.name === "AMAZON.YesIntent" ||
        handlerInput.requestEnvelope.request.intent.name === "AMAZON.MoreIntent")
      && sessionAttributes.rankingPage >= 1
  },

  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    const rankingPage = sessionAttributes.rankingPage++;

    const rankingSlot = sessionAttributes.rankingSlot;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    const distroRanking = getRankingByPeriod(rankingSlot);
    if (rankingPage * 10 >= distroRanking.distros.length) {
      const speechText = 'No hay mas distros que mostrarte'
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .withSimpleCard(SKILL_TITLE, speechText)
        .withShouldEndSession(true)
        .getResponse();
    }

    const startPos = rankingPage * 10;
    const endPos = startPos + 10;
    var distroListText = '';

    for (var i = startPos; i < endPos; i++) {
      const distro = distroRanking.distros[i];

      if (i % rankingPage > 0) {
        distroListText += ' ';
      }

      distroListText += `La <say-as interpret-as="cardinal">${distro.position}</say-as> distro es <lang xml:lang="en-US">${distro.name}</lang> con ${distro.hits} votos.`;
    }

    const speechText = `Las siguientes diez distribuciones son ${distroListText}. ¿Quieres saber las siguientes diez?`

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .getResponse();
  }
}

const DistroRankingStopNextIntentHandler = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && (handlerInput.requestEnvelope.request.intent.name === "AMAZON.NoIntent" ||
        handlerInput.requestEnvelope.request.intent.name === "AMAZON.CancelIntent")
      && sessionAttributes.rankingPage >= 1;
  },

  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    sessionAttributes.rankingPage = 0;
    sessionAttributes.rankingSlot = null;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    const speechText = '¡Hasta luego!';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .getResponse();
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Bienvenido a Distribuciones de Linux, di "muéstrame el ranking"';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText =
      'Puedes decir "muéstrame el ranking" o elegir entre el ultimo mes, tres, seis o doce meses, por ejemplo "muéstrame el ranking de los últimos seis meses".' +
      'Por defecto te muestro el ranking de este último mes.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = '¡Hasta luego!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended: ${handlerInput}`);

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes() || {};
    sessionAttributes.rankingPage = 0;
    sessionAttributes.rankingSlot = null;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);

    const speechText = 'Ha ocurrido un error, inténtalo mas tarde.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

let skill;

exports.handler = async function (event, context) {
  console.log(`SKILL REQUEST ${JSON.stringify(event)}`);

  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        DistroRankingIntentHandler,
        DistroRankingNextIntentHandler,
        DistroRankingStopNextIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`SKILL RESPONSE ${JSON.stringify(response)}`);

  return response;
};