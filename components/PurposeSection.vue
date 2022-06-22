<template>
  <h1 id="purpose">{{ $t('purpose') }}</h1>
  <h2>{{ $t('purpose_headline') }}</h2>

  <table class="table table-taxonomy">
    <thead>
      <tr>
        <th>Icon</th>
        <th>Purpose</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/enforcement.svg"
            alt="Encorcement"
          />
        </td>
        <td>{{ $t('purpose__enforcement') }}</td>
        <td v-html="$md.render($t('purpose__enforcement__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/energy.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__energy_efficiency') }}</td>
        <td v-html="$md.render($t('purpose__energy_efficiency__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/mobility.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__mobility') }}</td>
        <td v-html="$md.render($t('purpose__mobility__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/inform.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__inform') }}</td>
        <td v-html="$md.render($t('purpose__inform__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/planning.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__planning_decision_making') }}</td>
        <td v-html="$md.render($t('purpose__planning_decision_making__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/security.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__safety_security') }}</td>
        <td v-html="$md.render($t('purpose__safety_security__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/accessibility.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__accessibility') }}</td>
        <td v-html="$md.render($t('purpose__accessibility__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/ecology.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__ecology') }}</td>
        <td v-html="$md.render($t('purpose__ecology__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/waste.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__waste_management') }}</td>
        <td v-html="$md.render($t('purpose__waste_management__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/water.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__water_efficiency') }}</td>
        <td v-html="$md.render($t('purpose__water_efficiency__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/emergency.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__fire_emergency') }}</td>
        <td v-html="$md.render($t('purpose__fire_emergency__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/health.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__health') }}</td>
        <td v-html="$md.render($t('purpose__health__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/agency.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__agency_interaction') }}</td>
        <td v-html="$md.render($t('purpose__agency_interaction__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/toggle.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__switch') }}</td>
        <td v-html="$md.render($t('purpose__switch__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/research.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__research_development') }}</td>
        <td v-html="$md.render($t('purpose__research_development__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/entry.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__entry') }}</td>
        <td v-html="$md.render($t('purpose__entry__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/arts.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__arts_culture') }}</td>
        <td v-html="$md.render($t('purpose__arts_culture__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/connectivity.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__connectivity') }}</td>
        <td v-html="$md.render($t('purpose__connectivity__desc'))" />
      </tr>
      <tr>
        <td>
          <img
            src="https://dtpr.helpfulplaces.com/dtpr_icons/purpose/logistics.svg"
            alt=""
          />
        </td>
        <td>{{ $t('purpose__logistics') }}</td>
        <td v-html="$md.render($t('purpose__logistics__desc'))" />
      </tr>
    </tbody>
  </table>
</template>